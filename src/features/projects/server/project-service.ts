import { prisma } from "@/shared/server/prisma";
import { r2Storage } from "@/features/assets/server/r2-storage";
import type { CreateProjectInput, UpdateProjectInput } from "./project-schema";

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    select: projectListSelect()
  });
}

export async function createProject(userId: string, input: CreateProjectInput) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: { userId, title: input.title, aspectRatio: input.aspectRatio, status: "DRAFT" }
    });
    await tx.user.update({ where: { id: userId }, data: { projectCount: { increment: 1 } } });
    return project;
  });
}

function projectListSelect() {
  return {
    id: true,
    title: true,
    aspectRatio: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    archivedAt: true,
    sceneCount: true,
    readySceneCount: true,
    timelineItemCount: true,
    totalDurationSeconds: true
  } as const;
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

export async function deleteProject(userId: string, projectId: string) {
  const project = await projectDeleteData(userId, projectId);
  const totalAssetBytes = project.assets.reduce((sum, asset) => sum + (asset.sizeBytes ?? 0), 0);
  await prisma.$transaction([
    prisma.creditLedger.updateMany({
      where: { generationJobId: { in: project.jobs.map((job) => job.id) } },
      data: { generationJobId: null }
    }),
    prisma.project.delete({ where: { id: project.id } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        projectCount: { decrement: 1 },
        storageBytesUsed: { decrement: BigInt(totalAssetBytes) }
      }
    })
  ]);
  await deleteProjectStorage(project);
  return { id: project.id };
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

async function projectDeleteData(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: {
      id: true,
      assets: { select: { origin: true, r2Key: true, storageKey: true, storageProvider: true, sizeBytes: true } },
      exports: { select: { storageKey: true } },
      jobs: { select: { id: true } }
    }
  });
  if (!project) throw new Error("Project not found");
  return project;
}

async function deleteProjectStorage(project: ProjectDeleteData) {
  await Promise.all(storageKeys(project).map(deleteObject));
}

function storageKeys(project: ProjectDeleteData) {
  const keys = [...project.assets.map(assetKey), ...project.exports.map(exportKey)];
  return [...new Set(keys.filter(isStorageKey))];
}

function assetKey(asset: ProjectDeleteData["assets"][number]) {
  if (asset.storageProvider !== "r2" || asset.origin !== "R2") return null;
  return asset.r2Key ?? asset.storageKey;
}

function exportKey(item: ProjectDeleteData["exports"][number]) {
  if (!item.storageKey || item.storageKey.startsWith("http")) return null;
  return item.storageKey;
}

async function deleteObject(key: string) {
  await r2Storage.deleteObject(key).catch(() => undefined);
}

function isStorageKey(key: string | null): key is string {
  return Boolean(key);
}

type ProjectDeleteData = Awaited<ReturnType<typeof projectDeleteData>>;
