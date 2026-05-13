import { Prisma } from "@prisma/client";

export async function incrementBranchReadyScenes(
  tx: Prisma.TransactionClient,
  branchEntityId: string,
  delta: number
) {
  const branch = await tx.sceneBranch.update({
    where: { id: branchEntityId },
    data: branchReadyData(delta),
    select: { readyScenes: true, totalScenes: true }
  });
  const status = branch.readyScenes >= branch.totalScenes ? "READY" : "GENERATING";
  await tx.sceneBranch.update({ where: { id: branchEntityId }, data: { status } });
}

export function markBranchSceneReady(tx: Prisma.TransactionClient, branchEntityId: string) {
  return incrementBranchReadyScenes(tx, branchEntityId, 1);
}

export function markBranchFailed(
  tx: Prisma.TransactionClient,
  branchEntityId: string,
  wasReady: boolean
) {
  return tx.sceneBranch.update({
    where: { id: branchEntityId },
    data: branchFailureData(wasReady)
  });
}

function branchReadyData(delta: number) {
  return delta > 0 ? { readyScenes: { increment: delta } } : { readyScenes: { decrement: -delta } };
}

function branchFailureData(wasReady: boolean) {
  return {
    status: "FAILED" as const,
    ...(wasReady ? { readyScenes: { decrement: 1 } } : {})
  };
}
