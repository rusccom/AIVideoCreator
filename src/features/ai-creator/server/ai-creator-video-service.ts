import { prisma } from "@/shared/server/prisma";
import { createSceneForUser } from "@/features/generation/server/scene-service";
import { generateVideo, preflightVideoGeneration, selectStartImage } from "@/features/generation/server/generation-service";
import type { AiCreatorVideoInput } from "./ai-creator-video-schema";

export async function startAiCreatorVideo(userId: string, projectId: string, input: AiCreatorVideoInput) {
  await preflightVideoGeneration(userId, projectId, videoInput(input));
  await selectStartImage(userId, projectId, { assetId: input.assetId });
  const scene = await createAiCreatorScene(userId, projectId, input);
  try {
    const job = await generateVideo(userId, scene.id, videoInput(input));
    return { job, scene };
  } catch (error) {
    await cleanupCreditFailure(userId, scene.id, error);
    throw error;
  }
}

async function createAiCreatorScene(userId: string, projectId: string, input: AiCreatorVideoInput) {
  return createSceneForUser(userId, projectId, {
    durationSeconds: input.duration,
    modelId: input.modelId,
    prompt: input.prompt,
    startFrameAssetId: input.assetId
  });
}

async function cleanupCreditFailure(userId: string, sceneId: string, error: unknown) {
  if (!(error instanceof Error) || error.message !== "Insufficient credits") return;
  await deleteUnstartedScene(userId, sceneId);
}

async function deleteUnstartedScene(userId: string, sceneId: string) {
  const scene = await unstartedScene(userId, sceneId);
  if (!scene) return;
  await prisma.$transaction([
    prisma.generationJob.deleteMany({ where: { sceneId, providerRequestId: null } }),
    prisma.scene.delete({ where: { id: sceneId } })
  ]);
}

async function unstartedScene(userId: string, sceneId: string) {
  const scene = await prisma.scene.findFirst({ where: { id: sceneId, project: { userId } }, include: { jobs: true } });
  if (!scene || scene.status !== "DRAFT" || scene.videoAssetId) return null;
  return scene.jobs.some((job) => job.providerRequestId) ? null : scene;
}

function videoInput(input: AiCreatorVideoInput) {
  return {
    aspectRatio: input.aspectRatio,
    duration: input.duration,
    modelId: input.modelId,
    prompt: input.prompt,
    resolution: input.resolution
  };
}
