import { Prisma } from "@prisma/client";
import { incrementProjectReadyScenes, incrementProjectScenes, incrementProjectTimelineItems } from "@/shared/server/counters";
import { recordOutboxEvent } from "@/shared/server/outbox";
import { publishPendingOutboxEvents } from "@/shared/server/outbox-publisher";
import { prisma } from "@/shared/server/prisma";
import { touchProjectInTransaction } from "@/features/projects/server/project-touch-service";
import type { CreateSceneInput, PickFrameInput, UpdateSceneInput } from "./scene-schema";

const ORDER_OFFSET = 1000000;

export async function createScene(projectId: string, input: CreateSceneInput) {
  const orderIndex = await nextSceneIndex(projectId);
  const scene = await prisma.$transaction(async (tx) => {
    const scene = await tx.scene.create({ data: sceneCreateData(projectId, orderIndex, input) });
    const timeline = await tx.timelineItem.create({ data: await timelineCreateData(tx, scene) });
    await incrementProjectScenes(tx, projectId, 1);
    await incrementProjectTimelineItems(tx, projectId, 1, timeline.durationSeconds ?? scene.durationSeconds);
    await recordSceneEvent(tx, projectId, "scene.created", scene.id);
    await touchProjectInTransaction(tx, projectId);
    return scene;
  });
  await publishPendingOutboxEvents();
  return scene;
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
  const scene = await prisma.$transaction((tx) => updateSceneInTransaction(tx, sceneId, input));
  await publishPendingOutboxEvents();
  return scene;
}

async function updateSceneInTransaction(
  tx: Prisma.TransactionClient,
  sceneId: string,
  input: UpdateSceneInput
) {
  const previous = await sceneForUpdate(tx, sceneId);
  const scene = await tx.scene.update({ where: { id: sceneId }, data: input });
  await applyReadyCountDelta(tx, previous, scene);
  if (input.status === "READY") await markFollowingScenesStale(tx, scene.projectId, scene.orderIndex);
  await recordSceneEvent(tx, scene.projectId, "scene.updated", scene.id);
  return scene;
}

async function applyReadyCountDelta(
  tx: Prisma.TransactionClient,
  previous: { status: string; projectId: string },
  next: { status: string; projectId: string }
) {
  const delta = readyDelta(previous.status, next.status);
  if (delta === 0) return;
  await incrementProjectReadyScenes(tx, next.projectId, delta);
}

function readyDelta(previous: string, next: string) {
  const wasReady = previous === "READY" ? 1 : 0;
  const isReady = next === "READY" ? 1 : 0;
  return isReady - wasReady;
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
  const result = await prisma.$transaction(async (tx) => {
    const removedTimelines = await tx.timelineItem.findMany({
      where: { sceneId: scene.id },
      select: { durationSeconds: true, scene: { select: { durationSeconds: true } } }
    });
    await tx.scene.delete({ where: { id: scene.id } });
    await compactSceneOrder(tx, scene.projectId);
    await compactTimelineOrder(tx, scene.projectId);
    await incrementProjectScenes(tx, scene.projectId, -1);
    if (scene.status === "READY") await incrementProjectReadyScenes(tx, scene.projectId, -1);
    const durationDelta = removedTimelines.reduce((sum, item) => sum + (item.durationSeconds ?? item.scene.durationSeconds), 0);
    await incrementProjectTimelineItems(tx, scene.projectId, -removedTimelines.length, -durationDelta);
    await recordSceneEvent(tx, scene.projectId, "scene.deleted", scene.id);
    await touchProjectInTransaction(tx, scene.projectId);
    return { id: scene.id };
  });
  await publishPendingOutboxEvents();
  return result;
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

async function sceneForUpdate(tx: Prisma.TransactionClient, sceneId: string) {
  return tx.scene.findUniqueOrThrow({
    where: { id: sceneId },
    select: { status: true, projectId: true, orderIndex: true }
  });
}

async function markFollowingScenesStale(
  tx: Prisma.TransactionClient,
  projectId: string,
  orderIndex: number
) {
  const readyCount = await followingReadySceneCount(tx, projectId, orderIndex);
  await tx.scene.updateMany({
    where: { projectId, orderIndex: { gt: orderIndex } },
    data: { status: "STALE", isStale: true }
  });
  if (readyCount > 0) await incrementProjectReadyScenes(tx, projectId, -readyCount);
}

function followingReadySceneCount(
  tx: Prisma.TransactionClient,
  projectId: string,
  orderIndex: number
) {
  return tx.scene.count({ where: { projectId, orderIndex: { gt: orderIndex }, status: "READY" } });
}

async function compactSceneOrder(tx: Prisma.TransactionClient, projectId: string) {
  await moveSceneOrderToTemporary(tx, projectId);
  await tx.$executeRaw`
    UPDATE "Scene" s SET "orderIndex" = ordered.row_index
    FROM (
      SELECT id, row_number() OVER (ORDER BY "orderIndex" ASC) - 1 AS row_index
      FROM "Scene"
      WHERE "projectId" = ${projectId}
    ) ordered
    WHERE s.id = ordered.id AND s."orderIndex" <> ordered.row_index
  `;
}

async function compactTimelineOrder(tx: Prisma.TransactionClient, projectId: string) {
  await moveTimelineOrderToTemporary(tx, projectId);
  await tx.$executeRaw`
    UPDATE "TimelineItem" t SET "orderIndex" = ordered.row_index
    FROM (
      SELECT id, row_number() OVER (ORDER BY "orderIndex" ASC) - 1 AS row_index
      FROM "TimelineItem"
      WHERE "projectId" = ${projectId}
    ) ordered
    WHERE t.id = ordered.id AND t."orderIndex" <> ordered.row_index
  `;
}

function moveSceneOrderToTemporary(tx: Prisma.TransactionClient, projectId: string) {
  return tx.scene.updateMany({
    where: { projectId },
    data: { orderIndex: { increment: ORDER_OFFSET } }
  });
}

function moveTimelineOrderToTemporary(tx: Prisma.TransactionClient, projectId: string) {
  return tx.timelineItem.updateMany({
    where: { projectId },
    data: { orderIndex: { increment: ORDER_OFFSET } }
  });
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
    select: { id: true, projectId: true, status: true }
  });
  if (!scene) throw new Error("Scene not found");
  return scene;
}

async function recordSceneEvent(
  tx: Prisma.TransactionClient,
  projectId: string,
  type: string,
  sceneId: string
) {
  await recordOutboxEvent(tx, {
    aggregateId: projectId,
    aggregateType: "project",
    type,
    payload: { sceneId }
  });
}

type CreatedScene = Prisma.SceneGetPayload<{}>;
