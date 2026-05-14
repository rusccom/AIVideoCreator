import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { AssetOrigin, AssetType } from "@prisma/client";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { moveRemoteAssetToR2 } from "../src/application/assets/worker";
import { r2Storage } from "../src/application/assets/worker";

type DownloadableAsset = {
  externalUrl?: string | null;
  id: string;
  mimeType: string;
  origin?: AssetOrigin;
  projectId?: string | null;
  r2Key?: string | null;
  sizeBytes?: number | null;
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
  const stored = asset.origin === "EXTERNAL_URL" ? await moveRemoteAssetToR2(asset) : asset;
  if (stored.origin !== "R2" || !stored.r2Key) throw new Error("Asset is not stored in R2");
  return r2Storage.createGetUrl(stored.r2Key);
}
