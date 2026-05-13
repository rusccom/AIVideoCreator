import { prisma } from "@/shared/server/prisma";

const SEQUENCE_PREFIX = "ai_creator_sequence_";

export async function cleanupFailedAiCreatorSequence(sceneId?: string | null) {
  if (!sceneId) return;
  const scene = await sequenceScene(sceneId);
  if (!scene?.branchId?.startsWith(SEQUENCE_PREFIX)) return;
  const scenes = await branchScenes(scene.branchId);
  if (!shouldDeleteSequence(scenes)) return;
  await prisma.scene.deleteMany({ where: { id: { in: scenes.map((item) => item.id) } } });
}

async function sequenceScene(sceneId: string) {
  return prisma.scene.findUnique({
    where: { id: sceneId },
    select: { branchId: true }
  });
}

async function branchScenes(branchId: string) {
  return prisma.scene.findMany({
    where: { branchId },
    select: { id: true, status: true, videoAssetId: true }
  });
}

function shouldDeleteSequence(scenes: Awaited<ReturnType<typeof branchScenes>>) {
  return scenes.some((scene) => scene.status === "FAILED") && scenes.every(hasNoSavedClip);
}

function hasNoSavedClip(scene: Awaited<ReturnType<typeof branchScenes>>[number]) {
  return scene.status !== "READY" && !scene.videoAssetId;
}
