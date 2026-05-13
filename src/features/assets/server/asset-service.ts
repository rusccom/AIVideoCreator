import type { AssetType } from "@prisma/client";
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
  const stored = await storedAsset(asset);
  if (stored.storageKey.startsWith("http")) throw new Error("Asset is not stored in R2");
  return r2Storage.createGetUrl(stored.storageKey);
}

export async function deleteAssetForUser(userId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, userId },
    select: { id: true, storageKey: true, storageProvider: true }
  });
  if (!asset) throw new Error("Asset not found");
  await prisma.asset.delete({ where: { id: asset.id } });
  await deleteStoredObject(asset);
  return { id: asset.id };
}

async function storedAsset(asset: AssetReadRecord) {
  if (!asset.storageKey.startsWith("http")) return asset;
  return moveRemoteAssetToR2(asset);
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

async function deleteStoredObject(asset: AssetDeleteRecord) {
  if (asset.storageProvider !== "r2" || asset.storageKey.startsWith("http")) return;
  await r2Storage.deleteObject(asset.storageKey).catch(() => undefined);
}

type AssetReadRecord = {
  id: string;
  mimeType: string;
  projectId: string | null;
  sizeBytes: number | null;
  storageKey: string;
  type: AssetType;
  userId: string;
};

type AssetDeleteRecord = {
  id: string;
  storageKey: string;
  storageProvider: string;
};
