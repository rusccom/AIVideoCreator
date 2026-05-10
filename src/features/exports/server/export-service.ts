import { prisma } from "@/shared/server/prisma";
import type { CreateExportInput } from "./export-schema";

export async function createExportJob(userId: string, input: CreateExportInput) {
  await assertProjectOwner(userId, input.projectId);
  return prisma.exportJob.create({
    data: {
      userId,
      projectId: input.projectId,
      format: input.format,
      resolution: input.resolution,
      status: "QUEUED"
    }
  });
}

export async function getExportJob(userId: string, exportId: string) {
  return prisma.exportJob.findFirst({
    where: { id: exportId, userId },
    include: { project: { select: { title: true } } }
  });
}

export async function listReadyScenes(projectId: string) {
  return prisma.scene.findMany({
    where: { projectId, status: "READY", videoAssetId: { not: null } },
    orderBy: { orderIndex: "asc" }
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
