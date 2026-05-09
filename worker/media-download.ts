import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { AssetType } from "@prisma/client";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { moveRemoteAssetToR2 } from "../src/features/assets/server/asset-storage-service";
import { r2Storage } from "../src/features/assets/server/r2-storage";

type DownloadableAsset = {
  id: string;
  mimeType: string;
  projectId?: string | null;
  sizeBytes?: number | null;
  storageKey: string;
  type: AssetType;
  userId: string;
};

export async function downloadAsset(asset: DownloadableAsset, path: string) {
  const url = await assetUrl(asset);
  await downloadUrl(url, path);
}

export async function downloadUrl(url: string, path: string) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${response.status}`);
  }
  const body = Readable.fromWeb(response.body as unknown as NodeReadableStream);
  await pipeline(body, createWriteStream(path));
}

async function assetUrl(asset: DownloadableAsset) {
  const stored = asset.storageKey.startsWith("http") ? await moveRemoteAssetToR2(asset) : asset;
  return r2Storage.createGetUrl(stored.storageKey);
}
