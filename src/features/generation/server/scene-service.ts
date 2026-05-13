import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import type { CreateSceneInput, PickFrameInput, UpdateSceneInput } from "./scene-schema";

const ORDER_OFFSET = 1000000;

export async function createScene(projectId: string, input: CreateSceneInput) {
  const orderIndex = await nextSceneIndex(projectId);
  return prisma.$transaction(async (tx) => {
    const scene = await tx.scene.create({ data: sceneCreateData(projectId, orderIndex, input) });
    await tx.timelineItem.create({ data: await timelineCreateData(tx, scene) });
    return scene;
  });
}

export async function createSceneForUser(
  userId: string,
  projectId: string,
  input: CreateSceneInput
) {
  await assertProjectOwner(userId, projectId);
  return createScene(projectId, input);
}

export async function updateScene(sceneId: string, input: UpdateSceneInput) {
  const scene = await prisma.scene.update({
    where: { id: sceneId },
    data: input
  });
  if (input.status === "READY") {
    await markFollowingScenesStale(scene.projectId, scene.orderIndex);
  }
  return scene;
}

export async function updateSceneForUser(
  userId: string,
  sceneId: string,
  input: UpdateSceneInput
) {
  await assertSceneOwner(userId, sceneId);
  return updateScene(sceneId, input);
}

export async function deleteSceneForUser(userId: string, sceneId: string) {
  const scene = await sceneForDelete(userId, sceneId);
  return prisma.$transaction(async (tx) => {
    await tx.scene.delete({ where: { id: scene.id } });
    await compactSceneOrder(tx, scene.projectId);
    await compactTimelineOrder(tx, scene.projectId);
    return { id: scene.id };
  });
}

export async function createNextScene(previousSceneId: string, prompt: string) {
  const previous = await prisma.scene.findUniqueOrThrow({ where: { id: previousSceneId } });
  return createScene(previous.projectId, {
    prompt,
    modelId: previous.modelId,
    startFrameAssetId: previous.endFrameAssetId ?? undefined,
    parentSceneId: previous.id,
    branchId: previous.branchId ?? undefined
  });
}

export async function pickFrame(sceneId: string, input: PickFrameInput) {
  const scene = await sceneOwner(sceneId);
  return prisma.generationJob.create({
    data: {
      userId: scene.project.userId,
      projectId: scene.projectId,
      sceneId,
      provider: "worker",
      modelId: "ffmpeg-frame-pick",
      type: "FRAME_EXTRACT",
      status: "QUEUED",
      inputJson: input
    }
  });
}

export async function pickFrameForUser(
  userId: string,
  sceneId: string,
  input: PickFrameInput
) {
  await assertSceneOwner(userId, sceneId);
  return pickFrame(sceneId, input);
}

async function nextSceneIndex(projectId: string) {
  const last = await prisma.scene.findFirst({
    where: { projectId },
    orderBy: { orderIndex: "desc" }
  });
  return last ? last.orderIndex + 1 : 0;
}

function sceneCreateData(projectId: string, orderIndex: number, input: CreateSceneInput) {
  return {
    projectId,
    orderIndex,
    durationSeconds: input.durationSeconds,
    userPrompt: input.prompt,
    modelId: input.modelId,
    startFrameAssetId: input.startFrameAssetId,
    parentSceneId: input.parentSceneId,
    branchId: input.branchId
  };
}

async function timelineCreateData(tx: Prisma.TransactionClient, scene: CreatedScene) {
  return {
    projectId: scene.projectId,
    sceneId: scene.id,
    durationSeconds: scene.durationSeconds,
    orderIndex: await nextTimelineIndex(tx, scene.projectId)
  };
}

async function nextTimelineIndex(tx: Prisma.TransactionClient, projectId: string) {
  return tx.timelineItem.count({ where: { projectId } });
}

async function markFollowingScenesStale(projectId: string, orderIndex: number) {
  await prisma.scene.updateMany({
    where: { projectId, orderIndex: { gt: orderIndex } },
    data: { status: "STALE", isStale: true }
  });
}

async function compactSceneOrder(tx: Prisma.TransactionClient, projectId: string) {
  const scenes = await orderedScenes(tx, projectId);
  await moveScenesToTemporaryOrder(tx, projectId);
  await Promise.all(scenes.map((scene, index) => setSceneOrder(tx, scene.id, index)));
}

async function compactTimelineOrder(tx: Prisma.TransactionClient, projectId: string) {
  const items = await orderedTimelineItems(tx, projectId);
  await moveTimelineToTemporaryOrder(tx, projectId);
  await Promise.all(items.map((item, index) => setTimelineOrder(tx, item.id, index)));
}

async function sceneOwner(sceneId: string) {
  return prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    select: { projectId: true, project: { select: { userId: true } } }
  });
}

async function assertProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true }
  });
  if (!project) {
    throw new Error("Project not found");
  }
}

async function assertSceneOwner(userId: string, sceneId: string) {
  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, project: { userId } },
    select: { id: true }
  });
  if (!scene) {
    throw new Error("Scene not found");
  }
}

async function sceneForDelete(userId: string, sceneId: string) {
  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, project: { userId } },
    select: { id: true, projectId: true }
  });
  if (!scene) throw new Error("Scene not found");
  return scene;
}

async function orderedScenes(tx: Prisma.TransactionClient, projectId: string) {
  return tx.scene.findMany({
    where: { projectId },
    orderBy: { orderIndex: "asc" },
    select: { id: true }
  });
}

async function orderedTimelineItems(tx: Prisma.TransactionClient, projectId: string) {
  return tx.timelineItem.findMany({
    where: { projectId },
    orderBy: { orderIndex: "asc" },
    select: { id: true }
  });
}

function moveScenesToTemporaryOrder(tx: Prisma.TransactionClient, projectId: string) {
  return tx.scene.updateMany({
    where: { projectId },
    data: { orderIndex: { increment: ORDER_OFFSET } }
  });
}

function moveTimelineToTemporaryOrder(tx: Prisma.TransactionClient, projectId: string) {
  return tx.timelineItem.updateMany({
    where: { projectId },
    data: { orderIndex: { increment: ORDER_OFFSET } }
  });
}

function setSceneOrder(tx: Prisma.TransactionClient, id: string, orderIndex: number) {
  return tx.scene.update({ where: { id }, data: { orderIndex } });
}

function setTimelineOrder(tx: Prisma.TransactionClient, id: string, orderIndex: number) {
  return tx.timelineItem.update({ where: { id }, data: { orderIndex } });
}

type CreatedScene = Prisma.SceneGetPayload<{}>;
