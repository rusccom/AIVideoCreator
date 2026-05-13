import { Prisma } from "@prisma/client";
import { incrementProjectTimelineItems } from "@/shared/server/counters";
import { prisma } from "@/shared/server/prisma";
import { touchProjectInTransaction } from "@/features/projects/server/project-touch-service";
import type { CreateTimelineItemInput, ReorderTimelineInput } from "./timeline-schema";

export async function createTimelineItemForUser(
  userId: string,
  projectId: string,
  input: CreateTimelineItemInput
) {
  await assertProjectOwner(userId, projectId);
  await assertSceneInProject(projectId, input.sceneId);
  return prisma.$transaction((tx) => insertTimelineItem(tx, projectId, input));
}

export async function reorderTimelineForUser(
  userId: string,
  projectId: string,
  input: ReorderTimelineInput
) {
  await assertProjectOwner(userId, projectId);
  return prisma.$transaction((tx) => reorderTimeline(tx, projectId, input.itemIds));
}

export async function deleteTimelineItemForUser(userId: string, itemId: string) {
  const item = await timelineItemForUser(userId, itemId);
  return prisma.$transaction(async (tx) => {
    const duration = await itemDuration(tx, item.id);
    await tx.timelineItem.delete({ where: { id: item.id } });
    await compactOrder(tx, item.projectId);
    await incrementProjectTimelineItems(tx, item.projectId, -1, -duration);
    await touchProjectInTransaction(tx, item.projectId);
    return { id: item.id };
  });
}

async function insertTimelineItem(
  tx: Prisma.TransactionClient,
  projectId: string,
  input: CreateTimelineItemInput
) {
  const index = await insertIndex(tx, projectId, input.index);
  await shiftFromIndex(tx, projectId, index);
  const duration = await sceneDuration(tx, input.sceneId);
  const item = await tx.timelineItem.create({
    data: { projectId, sceneId: input.sceneId, orderIndex: index, durationSeconds: duration }
  });
  await incrementProjectTimelineItems(tx, projectId, 1, duration);
  await touchProjectInTransaction(tx, projectId);
  return item;
}

async function reorderTimeline(
  tx: Prisma.TransactionClient,
  projectId: string,
  itemIds: string[]
) {
  await assertFullTimeline(tx, projectId, itemIds);
  await applyOrder(tx, projectId, itemIds);
  await touchProjectInTransaction(tx, projectId);
  return tx.timelineItem.findMany({ where: { projectId }, orderBy: { orderIndex: "asc" } });
}

const ORDER_OFFSET = 1000000;

async function applyOrder(tx: Prisma.TransactionClient, projectId: string, itemIds: string[]) {
  if (!itemIds.length) return;
  await moveToTemporaryOrder(tx, projectId);
  await tx.$executeRaw`
    UPDATE "TimelineItem" t SET "orderIndex" = ordered.position - 1
    FROM unnest(${itemIds}::text[]) WITH ORDINALITY AS ordered(id, position)
    WHERE t.id = ordered.id AND t."projectId" = ${projectId}
  `;
}

async function compactOrder(tx: Prisma.TransactionClient, projectId: string) {
  await moveToTemporaryOrder(tx, projectId);
  await tx.$executeRaw`
    UPDATE "TimelineItem" t SET "orderIndex" = ordered.row_index
    FROM (
      SELECT id, row_number() OVER (ORDER BY "orderIndex" ASC) - 1 AS row_index
      FROM "TimelineItem"
      WHERE "projectId" = ${projectId}
    ) ordered
    WHERE t.id = ordered.id
  `;
}

async function shiftFromIndex(tx: Prisma.TransactionClient, projectId: string, index: number) {
  await moveToTemporaryOrder(tx, projectId, index);
  await tx.$executeRaw`
    UPDATE "TimelineItem"
    SET "orderIndex" = "orderIndex" - ${ORDER_OFFSET} + 1
    WHERE "projectId" = ${projectId} AND "orderIndex" >= ${ORDER_OFFSET}
  `;
}

async function moveToTemporaryOrder(tx: Prisma.TransactionClient, projectId: string, minIndex = 0) {
  await tx.timelineItem.updateMany({
    where: { projectId, orderIndex: { gte: minIndex } },
    data: { orderIndex: { increment: ORDER_OFFSET } }
  });
}

async function assertFullTimeline(
  tx: Prisma.TransactionClient,
  projectId: string,
  itemIds: string[]
) {
  const existing = await orderedItems(tx, projectId);
  const ids = new Set(itemIds);
  if (existing.length !== itemIds.length) throw new Error("Timeline changed");
  if (!existing.every((item) => ids.has(item.id))) throw new Error("Invalid timeline items");
}

async function insertIndex(
  tx: Prisma.TransactionClient,
  projectId: string,
  index?: number
) {
  const count = await tx.timelineItem.count({ where: { projectId } });
  return Math.max(0, Math.min(index ?? count, count));
}

async function sceneDuration(tx: Prisma.TransactionClient, sceneId: string) {
  const scene = await tx.scene.findUniqueOrThrow({
    where: { id: sceneId },
    select: { durationSeconds: true }
  });
  return scene.durationSeconds;
}

async function itemDuration(tx: Prisma.TransactionClient, itemId: string) {
  const item = await tx.timelineItem.findUniqueOrThrow({
    where: { id: itemId },
    select: { durationSeconds: true, scene: { select: { durationSeconds: true } } }
  });
  return item.durationSeconds ?? item.scene.durationSeconds;
}

async function assertProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true }
  });
  if (!project) throw new Error("Project not found");
}

async function assertSceneInProject(projectId: string, sceneId: string) {
  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, projectId },
    select: { id: true }
  });
  if (!scene) throw new Error("Scene not found");
}

async function timelineItemForUser(userId: string, itemId: string) {
  const item = await prisma.timelineItem.findFirst({
    where: { id: itemId, project: { userId } },
    select: { id: true, projectId: true }
  });
  if (!item) throw new Error("Timeline item not found");
  return item;
}

async function orderedItems(tx: Prisma.TransactionClient, projectId: string) {
  return tx.timelineItem.findMany({
    where: { projectId },
    orderBy: { orderIndex: "asc" },
    select: { id: true }
  });
}
