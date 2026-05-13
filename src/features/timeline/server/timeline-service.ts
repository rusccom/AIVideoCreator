import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { touchProjectInTransaction } from "@/features/projects/server/project-touch-service";
import type { CreateTimelineItemInput, ReorderTimelineInput } from "./timeline-schema";

const ORDER_OFFSET = 1000000;

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
    await tx.timelineItem.delete({ where: { id: item.id } });
    await compactOrder(tx, item.projectId);
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
  const item = await tx.timelineItem.create({
    data: {
      projectId,
      sceneId: input.sceneId,
      orderIndex: index,
      durationSeconds: await sceneDuration(tx, input.sceneId)
    }
  });
  await touchProjectInTransaction(tx, projectId);
  return item;
}

async function reorderTimeline(
  tx: Prisma.TransactionClient,
  projectId: string,
  itemIds: string[]
) {
  await assertFullTimeline(tx, projectId, itemIds);
  await moveToTemporaryOrder(tx, projectId);
  await Promise.all(itemIds.map((id, index) => setOrder(tx, id, index)));
  await touchProjectInTransaction(tx, projectId);
  return tx.timelineItem.findMany({ where: { projectId }, orderBy: { orderIndex: "asc" } });
}

async function compactOrder(tx: Prisma.TransactionClient, projectId: string) {
  const items = await orderedItems(tx, projectId);
  await moveToTemporaryOrder(tx, projectId);
  await Promise.all(items.map((item, index) => setOrder(tx, item.id, index)));
}

async function shiftFromIndex(tx: Prisma.TransactionClient, projectId: string, index: number) {
  const items = await tx.timelineItem.findMany({
    where: { projectId, orderIndex: { gte: index } },
    orderBy: { orderIndex: "asc" },
    select: { id: true, orderIndex: true }
  });
  await Promise.all(items.map((item) => setOrder(tx, item.id, item.orderIndex + ORDER_OFFSET)));
  await Promise.all(items.map((item) => setOrder(tx, item.id, item.orderIndex + 1)));
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

function moveToTemporaryOrder(tx: Prisma.TransactionClient, projectId: string) {
  return tx.timelineItem.updateMany({
    where: { projectId },
    data: { orderIndex: { increment: ORDER_OFFSET } }
  });
}

function setOrder(tx: Prisma.TransactionClient, id: string, orderIndex: number) {
  return tx.timelineItem.update({ where: { id }, data: { orderIndex } });
}
