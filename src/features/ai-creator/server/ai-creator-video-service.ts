import { prisma } from "@/shared/server/prisma";
import { createSceneForUser } from "@/features/generation/server/scene-service";
import { generateVideo, preflightVideoGeneration, selectStartImage } from "@/features/generation/server/generation-service";
import { getCreditBalance } from "@/features/generation/server/credit-service";
import { createAiCreatorSequenceId } from "./ai-creator-sequence-service";
import type { AiCreatorVideoInput, AiCreatorVideoSceneInput } from "./ai-creator-video-schema";

export async function startAiCreatorVideo(userId: string, projectId: string, input: AiCreatorVideoInput) {
  const drafts = videoScenes(input);
  await preflightSequence(userId, projectId, input, drafts);
  await selectStartImage(userId, projectId, { assetId: input.assetId });
  const sequence = await createAiCreatorSequence(userId, projectId, input, drafts);
  try {
    const job = await generateVideo(userId, sequence.scenes[0].id, videoInput(input, drafts[0]));
    return startedSequence(job, sequence);
  } catch (error) {
    await cleanupCreditFailure(userId, sequence.scenes.map((scene) => scene.id), error);
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
  const branchId = createAiCreatorSequenceId();
  const scenes: CreatedScene[] = [];
  let parentSceneId: string | undefined;
  for (const draft of drafts) {
    const scene = await createAiCreatorScene({ branchId, draft, input, parentSceneId, projectId, userId });
    scenes.push(scene);
    parentSceneId = scene.id;
  }
  return { id: branchId, scenes };
}

async function createAiCreatorScene(args: CreateAiCreatorSceneInput) {
  return createSceneForUser(args.userId, args.projectId, {
    branchId: args.branchId,
    durationSeconds: args.draft.duration,
    modelId: args.input.modelId,
    parentSceneId: args.parentSceneId,
    prompt: args.draft.prompt,
    startFrameAssetId: args.parentSceneId ? undefined : args.input.assetId
  });
}

function startedSequence(job: Awaited<ReturnType<typeof generateVideo>>, sequence: CreatedSequence) {
  return {
    job,
    scene: sequence.scenes[0],
    sequence: { id: sequence.id, sceneIds: sequence.scenes.map((scene) => scene.id), total: sequence.scenes.length }
  };
}

async function cleanupCreditFailure(userId: string, sceneIds: string[], error: unknown) {
  if (!(error instanceof Error) || error.message !== "Insufficient credits") return;
  await deleteUnstartedScenes(userId, sceneIds);
}

async function deleteUnstartedScenes(userId: string, sceneIds: string[]) {
  const scenes = await unstartedScenes(userId, sceneIds);
  const ids = scenes.map((scene) => scene.id);
  if (!ids.length) return;
  await prisma.$transaction([
    prisma.generationJob.deleteMany({ where: { sceneId: { in: ids }, providerRequestId: null } }),
    prisma.scene.deleteMany({ where: { id: { in: ids } } })
  ]);
}

async function unstartedScenes(userId: string, sceneIds: string[]) {
  const scenes = await prisma.scene.findMany({ where: { id: { in: sceneIds }, project: { userId } }, include: { jobs: true } });
  return scenes.filter((scene) => scene.status === "DRAFT" && !scene.videoAssetId && !scene.jobs.some((job) => job.providerRequestId));
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

type CreateAiCreatorSceneInput = {
  branchId: string;
  draft: AiCreatorVideoSceneInput;
  input: AiCreatorVideoInput;
  parentSceneId?: string;
  projectId: string;
  userId: string;
};
