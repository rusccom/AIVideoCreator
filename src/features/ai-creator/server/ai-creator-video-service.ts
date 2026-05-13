import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { createSceneForUser } from "@/features/generation/server/scene-service";
import { generateVideo, preflightVideoGeneration, selectStartImage } from "@/features/generation/server/generation-service";
import { getCreditBalance } from "@/features/generation/server/credit-service";
import type { AiCreatorVideoInput, AiCreatorVideoSceneInput } from "./ai-creator-video-schema";

export async function startAiCreatorVideo(userId: string, projectId: string, input: AiCreatorVideoInput) {
  const drafts = videoScenes(input);
  await preflightSequence(userId, projectId, input, drafts);
  if (!input.parentSceneId) {
    await selectStartImage(userId, projectId, { assetId: input.assetId });
  }
  const sequence = await createAiCreatorSequence(userId, projectId, input, drafts);
  try {
    const job = await generateVideo(userId, sequence.scenes[0].id, videoInput(input, drafts[0]));
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
  drafts: AiCreatorVideoSceneInput[]
) {
  const costs = await Promise.all(drafts.map((draft) => preflightVideoGeneration(userId, projectId, videoInput(input, draft))));
  const balance = await getCreditBalance(userId);
  if (balance < costs.reduce((sum, item) => sum + item.credits, 0)) throw new Error("Insufficient credits");
}

async function createAiCreatorSequence(
  userId: string,
  projectId: string,
  input: AiCreatorVideoInput,
  drafts: AiCreatorVideoSceneInput[]
) {
  const branch = await createSequenceBranch(projectId, drafts.length);
  const scenes: CreatedScene[] = [];
  let parentSceneId: string | undefined = input.parentSceneId;
  for (const draft of drafts) {
    const isFirstScene = scenes.length === 0;
    const scene = await createAiCreatorScene({ branchEntityId: branch.id, draft, input, isFirstScene, parentSceneId, projectId, userId });
    scenes.push(scene);
    parentSceneId = scene.id;
  }
  return { id: branch.id, scenes };
}

function createSequenceBranch(projectId: string, totalScenes: number) {
  return prisma.sceneBranch.create({
    data: { projectId, kind: "AI_CREATOR", status: "GENERATING", totalScenes }
  });
}

async function createAiCreatorScene(args: CreateAiCreatorSceneInput) {
  return createSceneForUser(args.userId, args.projectId, {
    branchEntityId: args.branchEntityId,
    durationSeconds: args.draft.duration,
    modelId: args.input.modelId,
    parentSceneId: args.parentSceneId,
    prompt: args.draft.prompt,
    startFrameAssetId: args.isFirstScene ? args.input.assetId : undefined
  });
}

function startedSequence(job: Awaited<ReturnType<typeof generateVideo>>, sequence: CreatedSequence) {
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
type CreatedScene = Awaited<ReturnType<typeof createSceneForUser>>;
type RemovableScene = Prisma.SceneGetPayload<{ include: { jobs: true } }>;

type CreateAiCreatorSceneInput = {
  branchEntityId: string;
  draft: AiCreatorVideoSceneInput;
  input: AiCreatorVideoInput;
  isFirstScene: boolean;
  parentSceneId?: string;
  projectId: string;
  userId: string;
};
