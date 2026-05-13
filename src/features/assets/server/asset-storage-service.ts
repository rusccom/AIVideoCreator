import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import { Prisma, type AssetOrigin, type AssetSource, type AssetType } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { r2Storage } from "./r2-storage";
import { buildStorageKey } from "./storage-key";

type AssetFileInput = {
  durationSeconds?: number | null;
  height?: number | null;
  metadata?: Prisma.InputJsonValue;
  mimeType: string;
  projectId?: string | null;
  sizeBytes?: number | null;
  source: AssetSource;
  type: AssetType;
  userId: string;
  width?: number | null;
};

type StorageKeyInput = {
  mimeType: string;
  projectId?: string | null;
  type: AssetType;
  userId: string;
};

export type LocalAssetInput = AssetFileInput & {
  localPath: string;
};

export type BufferAssetInput = AssetFileInput & {
  buffer: Buffer;
};

export type RemoteAssetInput = AssetFileInput & {
  remoteUrl: string;
};

export type RemoteStoredAsset = {
  externalUrl?: string | null;
  id: string;
  mimeType: string;
  origin?: AssetOrigin;
  projectId?: string | null;
  r2Key?: string | null;
  sizeBytes?: number | null;
  storageKey: string;
  type: AssetType;
  userId: string;
};

export async function createAssetFromLocalFile(input: LocalAssetInput) {
  const assetId = randomUUID();
  const sizeBytes = await fileSize(input.localPath);
  const storageKey = buildLocalStorageKey(input, assetId);
  await r2Storage.uploadLocalFile({ key: storageKey, mimeType: input.mimeType, path: input.localPath, sizeBytes });
  return createStoredAsset(input, assetId, storageKey, input.mimeType, sizeBytes);
}

export async function createAssetFromBuffer(input: BufferAssetInput) {
  const assetId = randomUUID();
  const storageKey = buildLocalStorageKey(input, assetId);
  await r2Storage.uploadBuffer({ buffer: input.buffer, key: storageKey, mimeType: input.mimeType });
  return createStoredAsset(input, assetId, storageKey, input.mimeType, input.buffer.byteLength);
}

export async function createAssetFromRemoteUrl(input: RemoteAssetInput) {
  const assetId = randomUUID();
  const storageKey = buildLocalStorageKey(input, assetId);
  const upload = await r2Storage.uploadRemoteUrl({ key: storageKey, mimeType: input.mimeType, url: input.remoteUrl });
  return createStoredAsset(input, assetId, storageKey, upload.mimeType, input.sizeBytes ?? upload.sizeBytes);
}

export async function moveRemoteAssetToR2(asset: RemoteStoredAsset) {
  if (asset.origin === "R2") return asset;
  const remoteUrl = asset.externalUrl ?? remoteStorageUrl(asset);
  if (!remoteUrl) throw new Error("Asset has no remote URL");
  const storageKey = buildLocalStorageKey(asset, asset.id);
  const upload = await r2Storage.uploadRemoteUrl({ key: storageKey, mimeType: asset.mimeType, url: remoteUrl });
  return markAssetStored(asset.id, storageKey, upload.mimeType, asset.sizeBytes ?? upload.sizeBytes);
}

function remoteStorageUrl(asset: RemoteStoredAsset) {
  return asset.storageKey.startsWith("http") ? asset.storageKey : null;
}

async function createStoredAsset(
  input: AssetFileInput,
  assetId: string,
  storageKey: string,
  mimeType: string,
  sizeBytes?: number | null
) {
  return prisma.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data: {
        ...assetDimensions(input),
        id: assetId,
        userId: input.userId,
        projectId: input.projectId,
        type: input.type,
        source: input.source,
        origin: "R2",
        r2Key: storageKey,
        storageProvider: "r2",
        storageBucket: r2Storage.bucketName(),
        storageKey,
        mimeType,
        sizeBytes,
        metadataJson: input.metadata ?? Prisma.JsonNull
      }
    });
    if (sizeBytes) {
      await tx.user.update({
        where: { id: input.userId },
        data: { storageBytesUsed: { increment: BigInt(sizeBytes) } }
      });
    }
    return asset;
  });
}

function markAssetStored(assetId: string, storageKey: string, mimeType: string, sizeBytes?: number | null) {
  return prisma.$transaction(async (tx) => {
    const previous = await tx.asset.findUniqueOrThrow({ where: { id: assetId }, select: { sizeBytes: true, userId: true } });
    const nextSize = sizeBytes ?? previous.sizeBytes;
    const asset = await tx.asset.update({
      where: { id: assetId },
      data: storedAssetData(storageKey, mimeType, nextSize)
    });
    const delta = (nextSize ?? 0) - (previous.sizeBytes ?? 0);
    if (delta !== 0) {
      await tx.user.update({ where: { id: previous.userId }, data: { storageBytesUsed: { increment: BigInt(delta) } } });
    }
    return asset;
  });
}

function storedAssetData(storageKey: string, mimeType: string, sizeBytes?: number | null) {
  return {
    origin: "R2" as const,
    r2Key: storageKey,
    externalUrl: null,
    storageProvider: "r2",
    storageBucket: r2Storage.bucketName(),
    storageKey,
    mimeType,
    sizeBytes
  };
}

function buildLocalStorageKey(input: StorageKeyInput, assetId: string) {
  return buildStorageKey({
    assetId,
    mimeType: input.mimeType,
    projectId: input.projectId ?? undefined,
    type: input.type,
    userId: input.userId
  });
}

function assetDimensions(input: AssetFileInput) {
  return {
    durationSeconds: input.durationSeconds,
    height: input.height,
    width: input.width
  };
}

async function fileSize(path: string) {
  return (await stat(path)).size;
}
