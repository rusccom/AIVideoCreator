import { Prisma } from "@prisma/client";
import { cleanupFailedAiCreatorSequence } from "@/shared/server/ai-creator-sequence-cleanup";
import { createAssetFromRemoteUrl } from "@/shared/server/asset-storage-service";
import { touchProjectInTransaction } from "@/shared/server/project-touch";
import { incrementProjectReadyScenes, incrementProjectTimelineItems } from "@/shared/server/counters";
import { recordOutboxEvent } from "@/shared/server/outbox";
import { publishPendingOutboxEvents } from "@/shared/server/outbox-publisher";
import { prisma } from "@/shared/server/prisma";
import { commitCredits, refundCredits } from "./credit-service";
import { providerErrorPayload } from "@/shared/server/provider-error";
import { completeImageGenerationJob } from "./generation-image-result-service";
import { markBranchFailed, markBranchSceneReady } from "./scene-branch-counters";
import { videoAssetData, videoDuration, videoPayload, type VideoPayload } from "./generation-video-payload";

export async function completeGenerationJob(jobId: string, data: unknown) {
  const claim = await claimGenerationCompletion(jobId);
  const job = claim.job;
  if (!claim.ready) return job;
  const result = job.type === "IMAGE_GENERATION"
    ? await completeImageGenerationJob(job, data)
    : await completeVideoGenerationJob(job, data);
  await publishPendingOutboxEvents();
  return result;
}

export async function failGenerationJob(jobId: string, payload: unknown, reason: string) {
  const job = await prisma.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  await refundCredits(jobId, reason);
  await markSceneFailed(job.sceneId);
  await cleanupFailedAiCreatorSequence(job.sceneId);
  const result = await markJobFailed(jobId, payload);
  await publishPendingOutboxEvents();
  return result;
}

async function createVideoAsset(job: JobRecord, data: unknown) {
  const video = videoPayload(data);
  if (!video || !job.projectId || !job.sceneId) return null;
  const projectId = job.projectId;
  const asset = await createAssetFromRemoteUrl(videoAssetData({ ...job, projectId }, video));
  await saveReadyScene({ assetId: asset.id, jobId: job.id, projectId, sceneId: job.sceneId, video });
  return asset;
}

async function saveReadyScene(input: ReadySceneInput) {
  const durationSeconds = videoDuration(input.video);
  await prisma.$transaction((tx) => saveReadySceneInTransaction(tx, input, durationSeconds));
}

async function saveReadySceneInTransaction(
  tx: Prisma.TransactionClient,
  input: ReadySceneInput,
  durationSeconds: number
) {
  const previous = await sceneBeforeReady(tx, input.sceneId);
  const oldDuration = await timelineDuration(tx, input.sceneId, previous.durationSeconds);
  await tx.scene.update({ where: { id: input.sceneId }, data: sceneData(input.jobId, input.assetId, durationSeconds) });
  const timelines = await tx.timelineItem.updateMany({ where: { sceneId: input.sceneId }, data: { durationSeconds } });
  await updateProjectSceneCounters(tx, {
    durationSeconds,
    oldDuration,
    previous,
    projectId: input.projectId,
    timelineCount: timelines.count
  });
  await recordProjectEvent(tx, input.projectId, "scene.ready", { sceneId: input.sceneId });
  await touchProjectInTransaction(tx, input.projectId);
}

async function completeVideoGenerationJob(job: JobRecord, data: unknown) {
  try {
    const asset = await createVideoAsset(job, data);
    if (asset) await queueLastFrameJob(job, asset.id);
    await commitCredits(job.id);
    return markJobReady(job.id, data, asset ? [generatedAsset(asset.id)] : []);
  } catch (error) {
    return failGenerationJob(job.id, providerErrorPayload(error), "generation completion failed");
  }
}

async function claimGenerationCompletion(jobId: string) {
  const claim = await prisma.generationJob.updateMany({
    where: { id: jobId, status: "GENERATING" },
    data: { status: "PROCESSING" }
  });
  const job = await prisma.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  return { job, ready: claim.count === 1 };
}

function markJobReady(jobId: string, data: unknown, assets: GeneratedAsset[]) {
  return prisma.$transaction(async (tx) => {
    await recordJobResult(tx, jobId, data, assets);
    await recordJobEvent(tx, jobId, "job.completed");
    return tx.generationJob.update({
      where: { id: jobId },
      data: { status: "READY", completedAt: new Date() }
    });
  });
}

async function queueLastFrameJob(job: JobRecord, videoAssetId: string) {
  await prisma.generationJob.create({
    data: {
      userId: job.userId,
      projectId: job.projectId,
      sceneId: job.sceneId,
      provider: "worker",
      modelId: "ffmpeg-last-frame",
      type: "FRAME_EXTRACT",
      input: asJson({ mode: "last", videoAssetId })
    }
  });
}

function sceneData(jobId: string, assetId: string, durationSeconds: number) {
  return {
    generationJobId: jobId,
    videoAssetId: assetId,
    status: "READY" as const,
    durationSeconds
  };
}

async function markSceneFailed(sceneId?: string | null) {
  if (!sceneId) return;
  await prisma.$transaction(async (tx) => {
    const scene = await sceneBeforeFailure(tx, sceneId);
    if (!scene) return;
    await tx.scene.update({ where: { id: sceneId }, data: { status: "FAILED" } });
    if (scene.status === "READY") await incrementProjectReadyScenes(tx, scene.projectId, -1);
    if (scene.branchEntityId) {
      await markBranchFailed(tx, scene.branchEntityId, scene.status === "READY");
    }
    await recordProjectEvent(tx, scene.projectId, "scene.failed", { sceneId });
  });
}

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function sceneBeforeReady(tx: Prisma.TransactionClient, sceneId: string) {
  return tx.scene.findUniqueOrThrow({
    where: { id: sceneId },
    select: { branchEntityId: true, durationSeconds: true, status: true }
  });
}

async function timelineDuration(
  tx: Prisma.TransactionClient,
  sceneId: string,
  sceneDuration: number
) {
  const items = await tx.timelineItem.findMany({
    where: { sceneId },
    select: { durationSeconds: true }
  });
  return items.reduce((sum, item) => sum + (item.durationSeconds ?? sceneDuration), 0);
}

async function updateProjectSceneCounters(
  tx: Prisma.TransactionClient,
  input: ProjectSceneCounterInput
) {
  const readyDelta = input.previous.status !== "READY" ? 1 : 0;
  if (readyDelta) await incrementProjectReadyScenes(tx, input.projectId, readyDelta);
  await incrementProjectTimelineItems(tx, input.projectId, 0, durationDelta(input));
  if (readyDelta && input.previous.branchEntityId) await markBranchSceneReady(tx, input.previous.branchEntityId);
}

function durationDelta(input: ProjectSceneCounterInput) {
  return input.timelineCount * input.durationSeconds - input.oldDuration;
}

function markJobFailed(jobId: string, payload: unknown) {
  return prisma.$transaction(async (tx) => {
    await recordJobError(tx, jobId, payload);
    await recordJobEvent(tx, jobId, "job.failed");
    return tx.generationJob.update({
      where: { id: jobId },
      data: { status: "FAILED", completedAt: new Date() }
    });
  });
}

async function recordJobResult(
  tx: Prisma.TransactionClient,
  jobId: string,
  data: unknown,
  assets: GeneratedAsset[]
) {
  await tx.jobResult.upsert({
    where: { jobId },
    create: { jobId, assets: asJson(assets), rawResponse: asJson(data) },
    update: { assets: asJson(assets), rawResponse: asJson(data) }
  });
}

async function recordJobError(tx: Prisma.TransactionClient, jobId: string, payload: unknown) {
  await tx.jobError.upsert({
    where: { jobId },
    create: errorRecord(jobId, payload),
    update: errorUpdate(payload)
  });
}

function errorRecord(jobId: string, payload: unknown) {
  return { jobId, ...errorUpdate(payload) };
}

function errorUpdate(payload: unknown) {
  const error = record(payload);
  return {
    code: typeof error.code === "string" ? error.code : null,
    message: typeof error.message === "string" ? error.message : "Generation failed",
    rawError: asJson(payload)
  };
}

function sceneBeforeFailure(tx: Prisma.TransactionClient, sceneId: string) {
  return tx.scene.findUnique({
    where: { id: sceneId },
    select: { branchEntityId: true, projectId: true, status: true }
  });
}

function generatedAsset(assetId: string) {
  return { id: assetId, url: `/api/assets/${assetId}/signed-url` };
}

async function recordProjectEvent(
  tx: Prisma.TransactionClient,
  projectId: string,
  type: string,
  payload: Prisma.InputJsonObject
) {
  await recordOutboxEvent(tx, { aggregateId: projectId, aggregateType: "project", type, payload });
}

async function recordJobEvent(tx: Prisma.TransactionClient, jobId: string, type: string) {
  await recordOutboxEvent(tx, {
    aggregateId: jobId,
    aggregateType: "generationJob",
    type,
    payload: { jobId }
  });
}

type JobRecord = Awaited<ReturnType<typeof prisma.generationJob.findUniqueOrThrow>>;

type GeneratedAsset = ReturnType<typeof generatedAsset>;

type ReadySceneInput = {
  assetId: string;
  jobId: string;
  projectId: string;
  sceneId: string;
  video: VideoPayload;
};

type ProjectSceneCounterInput = {
  durationSeconds: number;
  oldDuration: number;
  previous: { branchEntityId: string | null; status: string };
  projectId: string;
  timelineCount: number;
};
