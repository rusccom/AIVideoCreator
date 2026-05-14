import type { AssetOrigin, AssetType, Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { moveRemoteAssetToR2 } from "./asset-storage-service";
import { r2Storage } from "./r2-storage";

export async function getAssetReadUrl(userId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, userId },
    select: assetReadFields()
  });
  if (!asset) throw new Error("Asset not found");
  const stored = await storedAsset(asset);
  const url = await resolveAssetReadUrl(stored);
  if (!url) throw new Error("Asset is not stored in R2");
  return url;
}

export async function resolveAssetReadUrl(asset: AssetReadUrlRecord) {
  if (asset.cdnUrl) return asset.cdnUrl;
  if (asset.origin === "EXTERNAL_URL") return asset.externalUrl ?? null;
  if (asset.origin !== "R2" || !asset.r2Key) return null;
  return cachedSignedUrl(asset);
}

async function storedAsset(asset: AssetReadRecord) {
  if (asset.origin === "R2") return asset;
  return moveRemoteAssetToR2(asset);
}

function assetReadFields() {
  return {
    cdnUrl: true,
    externalUrl: true,
    id: true,
    mimeType: true,
    origin: true,
    projectId: true,
    r2Key: true,
    signedUrlCache: true,
    sizeBytes: true,
    type: true,
    userId: true
  } as const;
}

async function cachedSignedUrl(asset: AssetReadUrlRecord) {
  const cached = validSignedUrl(asset.signedUrlCache);
  if (cached) return cached;
  const key = requiredR2Key(asset);
  const url = await r2Storage.createGetUrl(key);
  await saveSignedUrlCache(asset.id, url);
  return url;
}

function requiredR2Key(asset: AssetReadUrlRecord) {
  if (!asset.r2Key) throw new Error("Asset is not stored in R2");
  return asset.r2Key;
}

function validSignedUrl(value: unknown) {
  const cache = cacheRecord(value);
  if (typeof cache.url !== "string" || typeof cache.expiresAt !== "string") return null;
  return Date.parse(cache.expiresAt) > Date.now() + 60000 ? cache.url : null;
}

function saveSignedUrlCache(assetId: string, url: string) {
  return prisma.asset.update({
    where: { id: assetId },
    data: { signedUrlCache: { expiresAt: signedUrlExpiresAt().toISOString(), url } }
  });
}

function signedUrlExpiresAt() {
  return new Date(Date.now() + 1000 * 60 * 14);
}

function cacheRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

type AssetReadRecord = {
  cdnUrl: string | null;
  externalUrl: string | null;
  id: string;
  mimeType: string;
  origin: AssetOrigin;
  projectId: string | null;
  r2Key: string | null;
  signedUrlCache: Prisma.JsonValue | null;
  sizeBytes: number | null;
  type: AssetType;
  userId: string;
};

type AssetReadUrlRecord = {
  cdnUrl?: string | null;
  externalUrl?: string | null;
  id: string;
  origin?: AssetOrigin;
  r2Key?: string | null;
  signedUrlCache?: Prisma.JsonValue | null;
};
