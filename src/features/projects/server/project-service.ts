import { prisma } from "@/shared/server/prisma";
import type { CreateProjectInput, UpdateProjectInput } from "./project-schema";

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { scenes: true }
  });
}

export async function createProject(userId: string, input: CreateProjectInput) {
  return prisma.project.create({
    data: {
      userId,
      title: input.title,
      aspectRatio: input.aspectRatio,
      status: "DRAFT"
    }
  });
}

export async function getProject(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      scenes: { orderBy: { orderIndex: "asc" } },
      assets: { orderBy: { createdAt: "desc" } }
    }
  });
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput
) {
  await getOwnedProjectId(userId, projectId);
  return prisma.project.update({
    where: { id: projectId },
    data: input
  });
}

export async function archiveProject(userId: string, projectId: string) {
  await getOwnedProjectId(userId, projectId);
  return prisma.project.update({
    where: { id: projectId },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date()
    }
  });
}

async function getOwnedProjectId(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true }
  });
  if (!project) {
    throw new Error("Project not found");
  }
  return project.id;
}
