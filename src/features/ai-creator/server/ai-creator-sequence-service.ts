import { randomUUID } from "node:crypto";
import type { SceneStatus } from "@prisma/client";
import { generateVideo } from "@/features/generation/server/generation-service";
import type { GenerateVideoInput } from "@/features/generation/server/generation-schema";
import { getModel } from "@/features/generation/server/model-registry";
import { prisma } from "@/shared/server/prisma";

const SEQUENCE_PREFIX = "ai_creator_sequence_";

export function createAiCreatorSequenceId() {
  return `${SEQUENCE_PREFIX}${randomUUID()}`;
}

export async function getAiCreatorSequenceStatus(userId: string, sequenceId: string) {
  const scenes = await sequenceScenes(userId, sequenceId);
  if (!scenes.length) return emptySequenceStatus(sequenceId, 0);
  const total = scenes.length;
  if (!await hasSequenceScenes(userId, sequenceId)) return emptySequenceStatus(sequenceId, total);
  await advanceSequence(userId, sequenceId);
  const finalScenes = await sequenceScenes(userId, sequenceId);
  return finalScenes.length ? sequenceStatus(sequenceId, finalScenes, total) : emptySequenceStatus(sequenceId, total);
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

export async function retryFailedAiCreatorScene(userId: string, sequenceId: string) {
  const scene = await failedSequenceScene(userId, sequenceId);
  if (!scene) throw new Error("Failed scene not found");
  await ensureRetryStartFrame(userId, scene);
  return generateVideo(userId, scene.id, await linkedVideoInput(scene));
}

export async function updateFailedAiCreatorPrompt(userId: string, sequenceId: string, prompt: string) {
  const scene = await failedSequenceScene(userId, sequenceId);
  if (!scene) throw new Error("Failed scene not found");
  return prisma.scene.update({
    where: { id: scene.id },
    data: { userPrompt: prompt },
    select: { id: true, userPrompt: true }
  });
}

async function sequenceScenes(userId: string, sequenceId: string) {
  return prisma.scene.findMany({
    where: { branchId: sequenceId, project: { userId } },
    orderBy: { orderIndex: "asc" },
    select: { id: true, status: true, generationJobId: true, userPrompt: true }
  });
}

async function hasSequenceScenes(userId: string, sequenceId: string) {
  const count = await prisma.scene.count({ where: { branchId: sequenceId, project: { userId } } });
  return count > 0;
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
    failedScene: failedSceneStatus(scenes),
    id: sequenceId,
    readyCount,
    scenes: scenes.map(sequenceSceneStatus),
    status: finalStatus(scenes, readyCount),
    total
  };
}

function finalStatus(scenes: SequenceScene[], readyCount: number) {
  if (scenes.some((scene) => scene.status === "FAILED")) return "FAILED";
  return readyCount === scenes.length ? "READY" : "GENERATING";
}

function emptySequenceStatus(sequenceId: string, total: number) {
  return {
    failedScene: null,
    id: sequenceId,
    readyCount: 0,
    scenes: [] as SequenceSceneStatus[],
    status: "FAILED",
    total
  };
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

async function failedSequenceScene(userId: string, sequenceId: string) {
  return prisma.scene.findFirst({
    where: { branchId: sequenceId, project: { userId }, status: "FAILED" },
    orderBy: { orderIndex: "asc" },
    select: {
      durationSeconds: true,
      id: true,
      modelId: true,
      parentSceneId: true,
      project: { select: { aspectRatio: true } },
      startFrameAssetId: true,
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

async function linkedVideoInput(scene: LinkedVideoScene) {
  const model = await getModel(scene.modelId);
  return {
    aspectRatio: videoAspectRatio(model, scene.project.aspectRatio),
    duration: scene.durationSeconds,
    modelId: scene.modelId,
    prompt: scene.userPrompt,
    resolution: model.defaultResolution
  } satisfies GenerateVideoInput;
}

async function ensureRetryStartFrame(userId: string, scene: RetryScene) {
  if (scene.startFrameAssetId) return;
  const assetId = scene.parentSceneId ? await parentEndFrameAssetId(userId, scene.parentSceneId) : null;
  if (!assetId) throw new Error("Start frame is not ready");
  await prisma.scene.update({ where: { id: scene.id }, data: { startFrameAssetId: assetId } });
}

async function parentEndFrameAssetId(userId: string, sceneId: string) {
  const parent = await prisma.scene.findFirst({
    where: { id: sceneId, project: { userId } },
    select: { endFrameAssetId: true }
  });
  return parent?.endFrameAssetId;
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

function sequenceSceneStatus(scene: SequenceScene) {
  return {
    generationJobId: scene.generationJobId,
    id: scene.id,
    status: scene.status
  };
}

function failedSceneStatus(scenes: SequenceScene[]) {
  const scene = scenes.find((item) => item.status === "FAILED");
  return scene ? { id: scene.id, prompt: scene.userPrompt } : null;
}

type SequenceScene = Awaited<ReturnType<typeof sequenceScenes>>[number];
type SequenceFrameScene = Awaited<ReturnType<typeof sequenceFrameScenes>>[number];
type SequenceSceneStatus = ReturnType<typeof sequenceSceneStatus>;
type RetryScene = NonNullable<Awaited<ReturnType<typeof failedSequenceScene>>>;
type LinkedVideoScene = Pick<RetryScene, "durationSeconds" | "modelId" | "project" | "userPrompt">;
