import { prisma } from "@/shared/server/prisma";
import type { UploadUrlInput } from "./asset-schema";
import { moveRemoteAssetToR2 } from "./asset-storage-service";
import { r2Storage } from "./r2-storage";
import { buildStorageKey } from "./storage-key";

export async function createUploadUrl(userId: string, input: UploadUrlInput) {
  const asset = await prisma.asset.create({
    data: {
      userId,
      projectId: input.projectId,
      type: input.type,
      source: "UPLOAD",
      storageProvider: "r2",
      storageBucket: r2Storage.bucketName(),
      storageKey: "pending",
      mimeType: input.mimeType,
      metadataJson: { fileName: input.fileName }
    }
  });
  const storageKey = buildStorageKey({ ...input, userId, assetId: asset.id });
  await prisma.asset.update({ where: { id: asset.id }, data: { storageKey } });
  return { assetId: asset.id, uploadUrl: await r2Storage.createPutUrl(storageKey, input.mimeType) };
}

export async function getAssetReadUrl(userId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, userId },
    select: assetReadFields()
  });
  if (!asset) {
    throw new Error("Asset not found");
  }
  const stored = asset.storageKey.startsWith("http") ? await moveRemoteAssetToR2(asset) : asset;
  return r2Storage.createGetUrl(stored.storageKey);
}

function assetReadFields() {
  return {
    id: true,
    mimeType: true,
    projectId: true,
    sizeBytes: true,
    storageKey: true,
    type: true,
    userId: true
  } as const;
}
