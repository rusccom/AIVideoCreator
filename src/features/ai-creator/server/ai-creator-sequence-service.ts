import { randomUUID } from "node:crypto";
import type { SceneStatus } from "@prisma/client";
import { generateVideo } from "@/features/generation/server/generation-service";
import type { GenerateVideoInput } from "@/features/generation/server/generation-schema";
import { refreshGenerationJobForUser } from "@/features/generation/server/job-service";
import { getModel } from "@/features/generation/server/model-registry";
import { prisma } from "@/shared/server/prisma";

const SEQUENCE_PREFIX = "ai_creator_sequence_";

export function createAiCreatorSequenceId() {
  return `${SEQUENCE_PREFIX}${randomUUID()}`;
}

export async function getAiCreatorSequenceStatus(userId: string, sequenceId: string) {
  const scenes = await sequenceScenes(userId, sequenceId);
  const total = scenes.length;
  await refreshSequenceJobs(userId, scenes);
  await advanceSequence(userId, sequenceId);
  return sequenceStatus(sequenceId, await sequenceScenes(userId, sequenceId), total);
}

export async function startNextAiCreatorScene(userId: string, parentSceneId: string, frameAssetId: string) {
  const scene = await nextSequenceScene(userId, parentSceneId);
  if (!scene) return null;
  const claimed = await claimSceneStartFrame(scene.id, frameAssetId);
  if (!claimed) return null;
  try {
    return await generateVideo(userId, scene.id, await linkedVideoInput(scene));
  } catch {
    await markSceneFailed(scene.id);
    await deleteFollowingDraftScenes(userId, scene.id);
    return null;
  }
}

async function sequenceScenes(userId: string, sequenceId: string) {
  const scenes = await prisma.scene.findMany({
    where: { branchId: sequenceId, project: { userId } },
    orderBy: { orderIndex: "asc" },
    select: { id: true, status: true, generationJobId: true }
  });
  if (!scenes.length) throw new Error("AI Creator sequence not found");
  return scenes;
}

async function refreshSequenceJobs(userId: string, scenes: SequenceScene[]) {
  await Promise.all(scenes.map((scene) => refreshSequenceJob(userId, scene)));
}

async function refreshSequenceJob(userId: string, scene: SequenceScene) {
  if (!scene.generationJobId || scene.status !== "GENERATING") return;
  await refreshGenerationJobForUser(userId, scene.generationJobId);
}

async function advanceSequence(userId: string, sequenceId: string) {
  const scenes = await sequenceFrameScenes(userId, sequenceId);
  await Promise.all(scenes.map((scene) => advanceFromScene(userId, scene)));
}

async function advanceFromScene(userId: string, scene: SequenceFrameScene) {
  if (scene.status !== "READY" || !scene.endFrameAssetId) return;
  await startNextAiCreatorScene(userId, scene.id, scene.endFrameAssetId);
}

async function sequenceFrameScenes(userId: string, sequenceId: string) {
  return prisma.scene.findMany({
    where: { branchId: sequenceId, project: { userId } },
    orderBy: { orderIndex: "asc" },
    select: { endFrameAssetId: true, id: true, status: true }
  });
}

function sequenceStatus(sequenceId: string, scenes: SequenceScene[], total = scenes.length) {
  const readyCount = scenes.filter((scene) => scene.status === "READY").length;
  return {
    id: sequenceId,
    readyCount,
    scenes,
    status: finalStatus(scenes, readyCount),
    total
  };
}

function finalStatus(scenes: SequenceScene[], readyCount: number) {
  if (scenes.some((scene) => scene.status === "FAILED")) return "FAILED";
  return readyCount === scenes.length ? "READY" : "GENERATING";
}

async function nextSequenceScene(userId: string, parentSceneId: string) {
  return prisma.scene.findFirst({
    where: nextSceneWhere(userId, parentSceneId),
    select: {
      id: true,
      durationSeconds: true,
      modelId: true,
      project: { select: { aspectRatio: true } },
      userPrompt: true
    }
  });
}

function nextSceneWhere(userId: string, parentSceneId: string) {
  return {
    branchId: { startsWith: SEQUENCE_PREFIX },
    parentSceneId,
    startFrameAssetId: null,
    status: "DRAFT" as SceneStatus,
    project: { userId }
  };
}

async function linkedVideoInput(scene: NonNullable<Awaited<ReturnType<typeof nextSequenceScene>>>) {
  const model = await getModel(scene.modelId);
  return {
    aspectRatio: videoAspectRatio(model, scene.project.aspectRatio),
    duration: scene.durationSeconds,
    modelId: scene.modelId,
    prompt: scene.userPrompt,
    resolution: model.defaultResolution
  } satisfies GenerateVideoInput;
}

function videoAspectRatio(model: Awaited<ReturnType<typeof getModel>>, aspectRatio: string) {
  if (model.supportedAspectRatios.includes(aspectRatio)) return aspectRatio;
  return model.supportedAspectRatios.includes("auto") ? "auto" : model.defaultAspectRatio;
}

async function claimSceneStartFrame(sceneId: string, assetId: string) {
  const claim = await prisma.scene.updateMany({
    where: { id: sceneId, startFrameAssetId: null, status: "DRAFT" },
    data: { startFrameAssetId: assetId }
  });
  return claim.count === 1;
}

async function markSceneFailed(sceneId: string) {
  await prisma.scene.update({ where: { id: sceneId }, data: { status: "FAILED" } });
}

async function deleteFollowingDraftScenes(userId: string, sceneId: string) {
  const scene = await sequenceSceneForCleanup(userId, sceneId);
  if (!scene?.branchId) return;
  const ids = await followingDraftSceneIds(userId, scene.branchId, scene.orderIndex);
  if (!ids.length) return;
  await prisma.scene.deleteMany({ where: { id: { in: ids } } });
}

async function sequenceSceneForCleanup(userId: string, sceneId: string) {
  return prisma.scene.findFirst({
    where: { id: sceneId, branchId: { startsWith: SEQUENCE_PREFIX }, project: { userId } },
    select: { branchId: true, orderIndex: true }
  });
}

async function followingDraftSceneIds(userId: string, branchId: string, orderIndex: number) {
  const scenes = await prisma.scene.findMany({
    where: followingDraftWhere(userId, branchId, orderIndex),
    select: { id: true }
  });
  return scenes.map((scene) => scene.id);
}

function followingDraftWhere(userId: string, branchId: string, orderIndex: number) {
  return {
    branchId,
    generationJobId: null,
    orderIndex: { gt: orderIndex },
    project: { userId },
    status: "DRAFT" as SceneStatus,
    videoAssetId: null
  };
}

type SequenceScene = Awaited<ReturnType<typeof sequenceScenes>>[number];
type SequenceFrameScene = Awaited<ReturnType<typeof sequenceFrameScenes>>[number];
