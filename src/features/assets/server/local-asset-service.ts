import { stat } from "node:fs/promises";
import { Prisma, type AssetSource, type AssetType } from "@prisma/client";
import { bucketName, uploadFile } from "./r2-client";
import { buildStorageKey } from "./storage-key";
import { prisma } from "../../../shared/server/prisma";

export type LocalAssetInput = {
  localPath: string;
  metadata?: Prisma.InputJsonValue;
  mimeType: string;
  projectId?: string | null;
  source: AssetSource;
  type: AssetType;
  userId: string;
};

export async function createAssetFromLocalFile(input: LocalAssetInput) {
  const sizeBytes = await fileSize(input.localPath);
  const asset = await createPendingAsset(input, sizeBytes);
  const storageKey = buildLocalStorageKey(input, asset.id);
  await uploadFile(storageKey, input.mimeType, input.localPath);
  return prisma.asset.update({ where: { id: asset.id }, data: { storageKey } });
}

async function createPendingAsset(input: LocalAssetInput, sizeBytes: number) {
  return prisma.asset.create({
    data: {
      userId: input.userId,
      projectId: input.projectId,
      type: input.type,
      source: input.source,
      storageProvider: "r2",
      storageBucket: bucketName(),
      storageKey: "pending",
      mimeType: input.mimeType,
      sizeBytes,
      metadataJson: input.metadata ?? Prisma.JsonNull
    }
  });
}

function buildLocalStorageKey(input: LocalAssetInput, assetId: string) {
  return buildStorageKey({
    assetId,
    mimeType: input.mimeType,
    projectId: input.projectId ?? undefined,
    type: input.type,
    userId: input.userId
  });
}

async function fileSize(path: string) {
  return (await stat(path)).size;
}
