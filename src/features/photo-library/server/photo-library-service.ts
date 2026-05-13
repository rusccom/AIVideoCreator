import { Prisma } from "@prisma/client";
import { createAssetFromBuffer } from "@/features/assets/server/asset-storage-service";
import { touchProject } from "@/features/projects/server/project-touch-service";
import { prisma } from "@/shared/server/prisma";
import type { PhotoLibraryAsset } from "../types";

const PHOTO_TYPES = ["IMAGE", "FRAME", "THUMBNAIL"] as const;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export async function listProjectPhotos(userId: string, projectId: string) {
  await assertProjectOwner(userId, projectId);
  const assets = await prisma.asset.findMany({
    where: { projectId, userId, type: { in: [...PHOTO_TYPES] } },
    orderBy: { createdAt: "desc" }
  });
  return assets.map(toPhotoAsset);
}

export async function uploadProjectPhoto(userId: string, projectId: string, file: File) {
  await assertProjectOwner(userId, projectId);
  assertImageFile(file);
  const asset = await createAssetFromBuffer({
    buffer: Buffer.from(await file.arrayBuffer()),
    metadata: fileMetadata(file),
    mimeType: file.type || "image/png",
    projectId,
    source: "UPLOAD",
    type: "IMAGE",
    userId
  });
  await touchProject(projectId).catch(() => undefined);
  return toPhotoAsset(asset);
}

async function assertProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true }
  });
  if (!project) throw new Error("Project not found");
}

function toPhotoAsset(asset: PhotoAssetRecord) {
  return {
    id: asset.id,
    label: `${asset.type.toLowerCase()} - ${asset.source.toLowerCase()}`,
    type: asset.type,
    url: assetUrl(asset)
  } satisfies PhotoLibraryAsset;
}

function assetUrl(asset: PhotoAssetRecord) {
  if (asset.origin === "PENDING") return null;
  return asset.r2Key || asset.externalUrl ? `/api/assets/${asset.id}/signed-url` : null;
}

function assertImageFile(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Only image uploads are supported");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image is too large");
}

function fileMetadata(file: File) {
  return { fileName: file.name } as Prisma.InputJsonValue;
}

type PhotoAssetRecord = Awaited<ReturnType<typeof prisma.asset.findMany>>[number];
