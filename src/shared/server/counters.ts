import type { Prisma } from "@prisma/client";

export async function incrementUserCredits(tx: Prisma.TransactionClient, userId: string, delta: number) {
  await tx.user.update({ where: { id: userId }, data: { creditBalance: { increment: delta } } });
}

export async function incrementUserStorage(tx: Prisma.TransactionClient, userId: string, deltaBytes: number) {
  await tx.user.update({ where: { id: userId }, data: { storageBytesUsed: { increment: BigInt(deltaBytes) } } });
}

export async function incrementProjectScenes(tx: Prisma.TransactionClient, projectId: string, delta: number) {
  await tx.project.update({ where: { id: projectId }, data: { sceneCount: { increment: delta } } });
}

export async function incrementProjectReadyScenes(tx: Prisma.TransactionClient, projectId: string, delta: number) {
  await tx.project.update({ where: { id: projectId }, data: { readySceneCount: { increment: delta } } });
}

export async function incrementProjectTimelineItems(
  tx: Prisma.TransactionClient,
  projectId: string,
  delta: number,
  durationDelta: number
) {
  await tx.project.update({
    where: { id: projectId },
    data: {
      timelineItemCount: { increment: delta },
      totalDurationSeconds: { increment: durationDelta }
    }
  });
}
