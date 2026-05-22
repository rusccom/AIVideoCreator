import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import type { GenerateVideoInput } from "@/shared/generation/types";
import type { AiCreatorVideoInput, AiCreatorVideoSceneInput } from "./ai-creator-video-schema";

export type AiCreatorVideoGeneration = {
  createSceneChainForUser: (userId: string, projectId: string, input: CreateSceneChainInput) => Promise<CreatedScene[]>;
  generateVideo: (userId: string, sceneId: string, input: GenerateVideoInput) => Promise<GeneratedVideoJob>;
  getCreditBalance: (userId: string) => Promise<number>;
  preflightVideoGeneration: (userId: string, projectId: string, input: GenerateVideoInput) => Promise<{ credits: number }>;
  selectStartImage: (userId: string, projectId: string, input: { assetId: string }) => Promise<unknown>;
};

export async function startAiCreatorVideo(
  userId: string,
  projectId: string,
  input: AiCreatorVideoInput,
  generation: AiCreatorVideoGeneration
) {
  const drafts = videoScenes(input);
  await preflightSequence(userId, projectId, input, drafts, generation);
  if (!input.parentSceneId) {
    await generation.selectStartImage(userId, projectId, { assetId: input.assetId });
  }
  const sequence = await createAiCreatorSequence(userId, projectId, input, drafts, generation);
  try {
    const job = await generation.generateVideo(userId, sequence.scenes[0].id, videoInput(input, drafts[0]));
    return startedSequence(job, sequence);
  } catch (error) {
    await cleanupStartFailure(userId, sequence.id, sequence.scenes.map((scene) => scene.id));
    throw error;
  }
}

async function preflightSequence(
  userId: string,
  projectId: string,
  input: AiCreatorVideoInput,
  drafts: AiCreatorVideoSceneInput[],
  generation: AiCreatorVideoGeneration
) {
  const costs = await Promise.all(drafts.map((draft) => generation.preflightVideoGeneration(userId, projectId, videoInput(input, draft))));
  const balance = await generation.getCreditBalance(userId);
  if (balance < costs.reduce((sum, item) => sum + item.credits, 0)) throw new Error("Insufficient credits");
}

async function createAiCreatorSequence(
  userId: string,
  projectId: string,
  input: AiCreatorVideoInput,
  drafts: AiCreatorVideoSceneInput[],
  generation: AiCreatorVideoGeneration
) {
  const branch = await createSequenceBranch(projectId, drafts.length);
  const scenes = await generation.createSceneChainForUser(userId, projectId, {
    branchEntityId: branch.id,
    drafts: drafts.map((draft) => ({ durationSeconds: draft.duration, prompt: draft.prompt })),
    modelId: input.modelId,
    parentSceneId: input.parentSceneId,
    startFrameAssetIdForFirst: input.assetId
  });
  return { id: branch.id, scenes };
}

function createSequenceBranch(projectId: string, totalScenes: number) {
  return prisma.sceneBranch.create({
    data: { projectId, kind: "AI_CREATOR", status: "GENERATING", totalScenes }
  });
}

function startedSequence(job: GeneratedVideoJob, sequence: CreatedSequence) {
  return {
    job,
    scene: sequence.scenes[0],
    sequence: { id: sequence.id, sceneIds: sequence.scenes.map((scene) => scene.id), total: sequence.scenes.length }
  };
}

async function cleanupStartFailure(userId: string, sequenceId: string, sceneIds: string[]) {
  const scenes = await removableScenes(userId, sceneIds);
  const ids = scenes.map((scene) => scene.id);
  if (!ids.length) return;
  await prisma.scene.deleteMany({ where: { id: { in: ids } } });
  await prisma.sceneBranch.deleteMany({ where: { id: sequenceId, project: { userId } } });
}

async function removableScenes(userId: string, sceneIds: string[]) {
  const scenes = await prisma.scene.findMany({ where: { id: { in: sceneIds }, project: { userId } }, include: { jobs: true } });
  return scenes.filter(isRemovableScene);
}

function isRemovableScene(scene: RemovableScene) {
  return !scene.videoAssetId && !scene.jobs.some((job) => job.providerRequestId);
}

function videoScenes(input: AiCreatorVideoInput) {
  return input.scenes?.length ? input.scenes : [{ duration: input.duration, prompt: input.prompt }];
}

function videoInput(input: AiCreatorVideoInput, draft: AiCreatorVideoSceneInput) {
  return {
    aspectRatio: input.aspectRatio,
    duration: draft.duration,
    modelId: input.modelId,
    prompt: draft.prompt,
    resolution: input.resolution
  };
}

type CreatedSequence = Awaited<ReturnType<typeof createAiCreatorSequence>>;
type CreatedScene = { id: string };
type GeneratedVideoJob = { id: string; status: string };
type RemovableScene = Prisma.SceneGetPayload<{ include: { jobs: true } }>;
type CreateSceneChainInput = {
  branchEntityId?: string;
  drafts: Array<{ durationSeconds: number; prompt: string }>;
  modelId: string;
  parentSceneId?: string;
  startFrameAssetIdForFirst?: string;
};
