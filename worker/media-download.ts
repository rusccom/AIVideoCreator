import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { r2Storage } from "../src/features/assets/server/r2-storage";

type DownloadableAsset = {
  storageKey: string;
};

export async function downloadAsset(asset: DownloadableAsset, path: string) {
  const url = await assetUrl(asset.storageKey);
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

function assetUrl(storageKey: string) {
  if (storageKey.startsWith("http")) return storageKey;
  return r2Storage.createGetUrl(storageKey);
}
