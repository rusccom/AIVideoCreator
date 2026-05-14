import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";

export function touchProject(projectId: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: touchData(),
    select: { id: true }
  });
}

export function touchOwnedProjectInTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
  projectId: string
) {
  return tx.project.updateMany({
    where: { id: projectId, userId },
    data: touchData()
  });
}

export function touchProjectInTransaction(tx: Prisma.TransactionClient, projectId: string) {
  return tx.project.update({
    where: { id: projectId },
    data: touchData(),
    select: { id: true }
  });
}

function touchData() {
  return { updatedAt: new Date() };
}
