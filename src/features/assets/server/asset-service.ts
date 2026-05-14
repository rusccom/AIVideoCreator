import type { AssetOrigin, Prisma } from "@prisma/client";
import { touchOwnedProjectInTransaction } from "@/shared/server/project-touch";
import { prisma } from "@/shared/server/prisma";
import { r2Storage } from "@/shared/server/r2-storage";
import { buildStorageKey } from "@/shared/server/storage-key";
import type { UploadUrlInput } from "./asset-schema";

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

async function deleteStoredObject(asset: AssetDeleteRecord) {
  const key = r2DeleteKey(asset);
  if (!key) return;
  await r2Storage.deleteObject(key).catch(() => undefined);
}

function r2DeleteKey(asset: AssetDeleteRecord) {
  if (asset.origin !== "R2") return null;
  return asset.r2Key;
}

type AssetDeleteRecord = {
  id: string;
  origin: AssetOrigin;
  projectId: string | null;
  r2Key: string | null;
  sizeBytes: number | null;
};
