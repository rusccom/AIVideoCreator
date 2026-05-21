import { Prisma } from "@prisma/client";
import { recordOutboxEvent } from "@/shared/server/outbox";
import { prisma } from "@/shared/server/prisma";
import { incrementProjectReadyScenes, incrementProjectTimelineItems } from "@/shared/server/counters";
import { getCreditBalance, reserveCreditsInTransaction } from "../server/credit-service";
import type { GenerateVideoInput, ResolvedGenerateVideoInput } from "../server/generation-schema";
import { getModel } from "../server/model-registry";
import { estimateVideoCredits, resolveVideoInput } from "../server/pricing-service";
import { incrementBranchReadyScenes } from "../server/scene-branch-counters";

export async function generateVideoUseCase(userId: string, sceneId: string, input: GenerateVideoInput) {
  const scene = await ownedScene(userId, sceneId);
  assertStartFrame(scene.startFrameAssetId);
  const model = await getModel(input.modelId);
  const videoInput = resolveVideoInput(model, input);
  const credits = estimateVideoCredits(model, videoInput);
  await assertCredits(userId, credits);
  return prisma.$transaction((tx) => queueVideoGeneration(tx, {
    credits,
    modelId: model.id,
    scene,
    userId,
    videoInput
  }));
}

function jobInput(
  userId: string,
  scene: OwnedScene,
  modelId: string,
  input: ResolvedGenerateVideoInput,
  estimatedCredits: number
) {
  return { userId, projectId: scene.projectId, sceneId: scene.id, modelId, input, estimatedCredits };
}

async function queueVideoGeneration(
  tx: Prisma.TransactionClient,
  input: QueueVideoGenerationInput
) {
  const data = jobInput(input.userId, input.scene, input.modelId, input.videoInput, input.credits);
  const job = await tx.generationJob.create({ data: videoJobData(data) });
  await reserveCreditsInTransaction(tx, input.userId, input.credits, job.id, "video generation");
  await markSceneQueued(tx, input.scene, job.id, input.videoInput);
  return job;
}

function videoJobData(input: ReturnType<typeof jobInput>) {
  return {
    estimatedCredits: input.estimatedCredits,
    input: asJson(input.input),
    modelId: input.modelId,
    projectId: input.projectId,
    provider: "fal",
    sceneId: input.sceneId,
    type: "VIDEO_GENERATION" as const,
    userId: input.userId
  };
}

async function assertCredits(userId: string, credits: number) {
  const balance = await getCreditBalance(userId);
  if (balance < credits) throw new Error("Insufficient credits");
}

async function ownedScene(userId: string, sceneId: string) {
  return prisma.scene.findFirstOrThrow({ where: { id: sceneId, project: { userId } } });
}

async function markSceneQueued(
  tx: Prisma.TransactionClient,
  scene: OwnedScene,
  jobId: string,
  input: ResolvedGenerateVideoInput
) {
  const timelineDelta = await syncTimelineDuration(tx, scene, input.duration);
  await tx.scene.update({ where: { id: scene.id }, data: queuedSceneData(jobId, input) });
  await applyQueuedCounters(tx, scene, timelineDelta);
  await recordOutboxEvent(tx, sceneQueuedEvent(scene.projectId, scene.id));
}

async function syncTimelineDuration(
  tx: Prisma.TransactionClient,
  scene: OwnedScene,
  durationSeconds: number
) {
  const items = await tx.timelineItem.findMany({ where: { sceneId: scene.id }, select: { durationSeconds: true } });
  await tx.timelineItem.updateMany({ where: { sceneId: scene.id }, data: { durationSeconds } });
  return items.reduce((sum, item) => sum + durationSeconds - (item.durationSeconds ?? scene.durationSeconds), 0);
}

function queuedSceneData(jobId: string, input: ResolvedGenerateVideoInput) {
  return {
    durationSeconds: input.duration,
    generationJobId: jobId,
    isStale: false,
    modelId: input.modelId,
    status: "QUEUED" as const,
    userPrompt: input.prompt
  };
}

async function applyQueuedCounters(tx: Prisma.TransactionClient, scene: OwnedScene, timelineDelta: number) {
  if (timelineDelta) await incrementProjectTimelineItems(tx, scene.projectId, 0, timelineDelta);
  if (scene.status !== "READY") return;
  await incrementProjectReadyScenes(tx, scene.projectId, -1);
  if (scene.branchEntityId) await incrementBranchReadyScenes(tx, scene.branchEntityId, -1);
}

function sceneQueuedEvent(projectId: string, sceneId: string) {
  return { aggregateId: projectId, aggregateType: "project" as const, type: "scene.queued", payload: { sceneId } };
}

function assertStartFrame(assetId?: string | null) {
  if (!assetId) throw new Error("Start frame is required");
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

type OwnedScene = Awaited<ReturnType<typeof ownedScene>>;

type QueueVideoGenerationInput = {
  credits: number;
  modelId: string;
  scene: OwnedScene;
  userId: string;
  videoInput: ResolvedGenerateVideoInput;
};
