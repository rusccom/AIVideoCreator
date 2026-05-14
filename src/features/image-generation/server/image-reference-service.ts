import { getAssetReadUrl } from "@/shared/server/asset-read-url";
import { prisma } from "@/shared/server/prisma";

const PHOTO_TYPES = ["IMAGE", "FRAME", "THUMBNAIL"] as const;

export async function resolveReferenceImageUrl(
  userId: string,
  projectId: string,
  assetId?: string
) {
  if (!assetId) return null;
  await assertReferenceAsset(userId, projectId, assetId);
  return getAssetReadUrl(userId, assetId);
}

async function assertReferenceAsset(userId: string, projectId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, projectId, userId, type: { in: [...PHOTO_TYPES] } },
    select: { id: true }
  });
  if (!asset) throw new Error("Reference image not found");
}
