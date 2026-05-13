import type { SceneStatus } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";

export async function cleanupFailedAiCreatorSequence(sceneId?: string | null) {
  if (!sceneId) return;
  const scene = await failedAiCreatorScene(sceneId);
  if (!scene?.branchEntityId) return;
  await deleteFollowingDraftScenes(scene.branchEntityId, scene.orderIndex);
  await markBranchFailed(scene.branchEntityId);
}

function failedAiCreatorScene(sceneId: string) {
  return prisma.scene.findFirst({
    where: { id: sceneId, branch: { is: { kind: "AI_CREATOR" } } },
    select: { branchEntityId: true, orderIndex: true }
  });
}

function deleteFollowingDraftScenes(branchEntityId: string, orderIndex: number) {
  return prisma.scene.deleteMany({
    where: {
      branchEntityId,
      generationJobId: null,
      orderIndex: { gt: orderIndex },
      status: "DRAFT" as SceneStatus,
      videoAssetId: null
    }
  });
}

function markBranchFailed(branchEntityId: string) {
  return prisma.sceneBranch.update({
    where: { id: branchEntityId },
    data: { status: "FAILED" }
  });
}
