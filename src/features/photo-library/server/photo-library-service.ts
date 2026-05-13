import { prisma } from "@/shared/server/prisma";
import type { PhotoLibraryAsset } from "../types";

const PHOTO_TYPES = ["IMAGE", "FRAME", "THUMBNAIL"] as const;

export async function listProjectPhotos(userId: string, projectId: string) {
  await assertProjectOwner(userId, projectId);
  const assets = await prisma.asset.findMany({
    where: { projectId, userId, type: { in: [...PHOTO_TYPES] } },
    orderBy: { createdAt: "desc" }
  });
  return assets.map(toPhotoAsset);
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
  if (asset.storageProvider !== "r2" && !asset.storageKey.startsWith("http")) return null;
  return `/api/assets/${asset.id}/signed-url`;
}

type PhotoAssetRecord = Awaited<ReturnType<typeof prisma.asset.findMany>>[number];
