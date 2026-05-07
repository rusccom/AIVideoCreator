import { prisma } from "@/shared/server/prisma";
import type { UploadUrlInput } from "./asset-schema";
import { bucketName, createGetUrl, createPutUrl } from "./r2-client";
import { buildStorageKey } from "./storage-key";

export async function createUploadUrl(userId: string, input: UploadUrlInput) {
  const asset = await prisma.asset.create({
    data: {
      userId,
      projectId: input.projectId,
      type: input.type,
      source: "UPLOAD",
      storageProvider: "r2",
      storageBucket: bucketName(),
      storageKey: "pending",
      mimeType: input.mimeType,
      metadataJson: { fileName: input.fileName }
    }
  });
  const storageKey = buildStorageKey({ ...input, userId, assetId: asset.id });
  await prisma.asset.update({ where: { id: asset.id }, data: { storageKey } });
  return { assetId: asset.id, uploadUrl: await createPutUrl(storageKey, input.mimeType) };
}

export async function getAssetReadUrl(userId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, userId },
    select: { storageKey: true }
  });
  if (!asset) {
    throw new Error("Asset not found");
  }
  if (asset.storageKey.startsWith("http")) return asset.storageKey;
  return createGetUrl(asset.storageKey);
}
