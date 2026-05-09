import { stat } from "node:fs/promises";
import { Prisma, type AssetSource, type AssetType } from "@prisma/client";
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

export type RemoteAssetInput = AssetFileInput & {
  remoteUrl: string;
};

export type RemoteStoredAsset = {
  id: string;
  mimeType: string;
  projectId?: string | null;
  sizeBytes?: number | null;
  storageKey: string;
  type: AssetType;
  userId: string;
};

export async function createAssetFromLocalFile(input: LocalAssetInput) {
  const asset = await createPendingAsset(input, await fileSize(input.localPath));
  const storageKey = buildLocalStorageKey(input, asset.id);
  await r2Storage.uploadLocalFile({ key: storageKey, mimeType: input.mimeType, path: input.localPath });
  return markAssetStored(asset.id, storageKey, input.mimeType, asset.sizeBytes);
}

export async function createAssetFromRemoteUrl(input: RemoteAssetInput) {
  const asset = await createPendingAsset(input, input.sizeBytes);
  const storageKey = buildLocalStorageKey(input, asset.id);
  const upload = await r2Storage.uploadRemoteUrl({ key: storageKey, mimeType: input.mimeType, url: input.remoteUrl });
  return markAssetStored(asset.id, storageKey, upload.mimeType, input.sizeBytes ?? upload.sizeBytes);
}

export async function moveRemoteAssetToR2(asset: RemoteStoredAsset) {
  const storageKey = buildLocalStorageKey(asset, asset.id);
  const upload = await r2Storage.uploadRemoteUrl({ key: storageKey, mimeType: asset.mimeType, url: asset.storageKey });
  return markAssetStored(asset.id, storageKey, upload.mimeType, asset.sizeBytes ?? upload.sizeBytes);
}

async function createPendingAsset(input: AssetFileInput, sizeBytes?: number | null) {
  return prisma.asset.create({
    data: {
      ...assetDimensions(input),
      userId: input.userId,
      projectId: input.projectId,
      type: input.type,
      source: input.source,
      storageProvider: "r2",
      storageBucket: r2Storage.bucketName(),
      storageKey: "pending",
      mimeType: input.mimeType,
      sizeBytes,
      metadataJson: input.metadata ?? Prisma.JsonNull
    }
  });
}

function markAssetStored(assetId: string, storageKey: string, mimeType: string, sizeBytes?: number | null) {
  return prisma.asset.update({
    where: { id: assetId },
    data: {
      storageProvider: "r2",
      storageBucket: r2Storage.bucketName(),
      storageKey,
      mimeType,
      sizeBytes
    }
  });
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
