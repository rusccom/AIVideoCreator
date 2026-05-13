import type { AssetOrigin, AssetType, Prisma } from "@prisma/client";
import { touchOwnedProjectInTransaction } from "@/features/projects/server/project-touch-service";
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
      origin: "PENDING",
      mimeType: input.mimeType,
      metadataJson: { fileName: input.fileName }
    }
  });
  const r2Key = buildStorageKey({ ...input, userId, assetId: asset.id });
  await saveUploadAsset(userId, input, asset.id, r2Key);
  return { assetId: asset.id, uploadUrl: await r2Storage.createPutUrl(r2Key, input.mimeType) };
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
  const key = r2ReadKey(stored);
  if (!key) throw new Error("Asset is not stored in R2");
  return r2Storage.createGetUrl(key);
}

export async function deleteAssetForUser(userId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, userId },
    select: {
      id: true,
      origin: true,
      projectId: true,
      r2Key: true,
      sizeBytes: true
    }
  });
  if (!asset) throw new Error("Asset not found");
  await deleteAssetRecord(userId, asset);
  await deleteStoredObject(asset);
  return { id: asset.id };
}

async function saveUploadAsset(
  userId: string,
  input: UploadUrlInput,
  assetId: string,
  r2Key: string
) {
  await prisma.$transaction(async (tx) => {
    await tx.asset.update({
      where: { id: assetId },
      data: { r2Key, origin: "R2" }
    });
    await touchUploadedProject(tx, userId, input.projectId);
  });
}

async function deleteAssetRecord(userId: string, asset: AssetDeleteRecord) {
  await prisma.$transaction(async (tx) => {
    await tx.asset.delete({ where: { id: asset.id } });
    await touchDeletedAssetProject(tx, userId, asset.projectId);
    if (asset.sizeBytes) {
      await tx.user.update({
        where: { id: userId },
        data: { storageBytesUsed: { decrement: BigInt(asset.sizeBytes) } }
      });
    }
  });
}

async function touchUploadedProject(
  tx: Prisma.TransactionClient,
  userId: string,
  projectId?: string | null
) {
  if (!projectId) return;
  await touchOwnedProjectInTransaction(tx, userId, projectId);
}

async function touchDeletedAssetProject(
  tx: Prisma.TransactionClient,
  userId: string,
  projectId?: string | null
) {
  if (!projectId) return;
  await touchOwnedProjectInTransaction(tx, userId, projectId);
}

async function storedAsset(asset: AssetReadRecord) {
  if (asset.origin === "R2") return asset;
  return moveRemoteAssetToR2(asset);
}

function assetReadFields() {
  return {
    id: true,
    externalUrl: true,
    origin: true,
    mimeType: true,
    projectId: true,
    r2Key: true,
    sizeBytes: true,
    type: true,
    userId: true
  } as const;
}

async function deleteStoredObject(asset: AssetDeleteRecord) {
  const key = r2DeleteKey(asset);
  if (!key) return;
  await r2Storage.deleteObject(key).catch(() => undefined);
}

function r2ReadKey(asset: R2ReadableAsset) {
  if (asset.origin !== "R2") return null;
  return asset.r2Key;
}

function r2DeleteKey(asset: AssetDeleteRecord) {
  if (asset.origin !== "R2") return null;
  return asset.r2Key;
}

type AssetReadRecord = {
  externalUrl: string | null;
  id: string;
  mimeType: string;
  origin: AssetOrigin;
  projectId: string | null;
  r2Key: string | null;
  sizeBytes: number | null;
  type: AssetType;
  userId: string;
};

type AssetDeleteRecord = {
  id: string;
  origin: AssetOrigin;
  projectId: string | null;
  r2Key: string | null;
  sizeBytes: number | null;
};

type R2ReadableAsset = {
  origin?: AssetOrigin;
  r2Key?: string | null;
};
