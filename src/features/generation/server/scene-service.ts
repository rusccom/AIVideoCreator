import { prisma } from "@/shared/server/prisma";
import type { CreateSceneInput, PickFrameInput, UpdateSceneInput } from "./scene-schema";

export async function createScene(projectId: string, input: CreateSceneInput) {
  const orderIndex = await nextSceneIndex(projectId);
  return prisma.scene.create({
    data: {
      projectId,
      orderIndex,
      durationSeconds: input.durationSeconds,
      userPrompt: input.prompt,
      modelId: input.modelId,
      startFrameAssetId: input.startFrameAssetId,
      parentSceneId: input.parentSceneId,
      branchId: input.branchId
    }
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

async function markFollowingScenesStale(projectId: string, orderIndex: number) {
  await prisma.scene.updateMany({
    where: { projectId, orderIndex: { gt: orderIndex } },
    data: { status: "STALE", isStale: true }
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
