import type { Prisma } from "@prisma/client";
import { incrementProjectScenes, incrementProjectTimelineItems } from "@/shared/server/counters";
import { recordOutboxEvent } from "@/shared/server/outbox";
import { publishPendingOutboxEvents } from "@/shared/server/outbox-publisher";
import { prisma } from "@/shared/server/prisma";
import { touchProjectInTransaction } from "@/shared/server/project-touch";

export type CreateSceneChainDraft = {
  durationSeconds: number;
  prompt: string;
};

export type CreateSceneChainInput = {
  branchEntityId?: string;
  drafts: CreateSceneChainDraft[];
  modelId: string;
  parentSceneId?: string;
  startFrameAssetIdForFirst?: string;
};

export async function createSceneChainForUser(
  userId: string,
  projectId: string,
  input: CreateSceneChainInput
) {
  await assertProjectOwner(userId, projectId);
  if (!input.drafts.length) return [];
  const scenes = await prisma.$transaction((tx) => createChainInTransaction(tx, projectId, input));
  await publishPendingOutboxEvents();
  return scenes;
}

async function createChainInTransaction(
  tx: Prisma.TransactionClient,
  projectId: string,
  input: CreateSceneChainInput
) {
  const start = await chainStart(tx, projectId);
  const created: ChainedScene[] = [];
  let prevSceneId = input.parentSceneId;
  let totalDuration = 0;
  for (let i = 0; i < input.drafts.length; i++) {
    const scene = await tx.scene.create({ data: chainSceneData(projectId, start.sceneIndex + i, input, i, prevSceneId) });
    await tx.timelineItem.create({ data: chainTimelineData(scene, start.timelineIndex + i) });
    await recordOutboxEvent(tx, { aggregateId: projectId, aggregateType: "project", type: "scene.created", payload: { sceneId: scene.id } });
    created.push(scene);
    totalDuration += scene.durationSeconds;
    prevSceneId = scene.id;
  }
  await incrementProjectScenes(tx, projectId, input.drafts.length);
  await incrementProjectTimelineItems(tx, projectId, input.drafts.length, totalDuration);
  await touchProjectInTransaction(tx, projectId);
  return created;
}

async function chainStart(tx: Prisma.TransactionClient, projectId: string) {
  const project = await tx.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { sceneCount: true }
  });
  const timelineIndex = await tx.timelineItem.count({ where: { projectId } });
  return { sceneIndex: project.sceneCount, timelineIndex };
}

function chainSceneData(
  projectId: string,
  orderIndex: number,
  input: CreateSceneChainInput,
  i: number,
  parentSceneId?: string
) {
  const draft = input.drafts[i];
  return {
    projectId,
    orderIndex,
    durationSeconds: draft.durationSeconds,
    userPrompt: draft.prompt,
    modelId: input.modelId,
    branchEntityId: input.branchEntityId,
    parentSceneId,
    startFrameAssetId: i === 0 ? input.startFrameAssetIdForFirst : undefined
  };
}

function chainTimelineData(scene: ChainedScene, orderIndex: number) {
  return {
    projectId: scene.projectId,
    sceneId: scene.id,
    durationSeconds: scene.durationSeconds,
    orderIndex
  };
}

async function assertProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true }
  });
  if (!project) throw new Error("Project not found");
}

type ChainedScene = Prisma.SceneGetPayload<{}>;
