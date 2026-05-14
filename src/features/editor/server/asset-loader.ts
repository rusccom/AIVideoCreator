import { prisma } from "@/shared/server/prisma";
import { resolveAssetReadUrl } from "@/shared/server/asset-read-url";

type SceneRefs = {
  startFrameAssetId: string | null;
  videoAssetId: string | null;
  endFrameAssetId: string | null;
};

type EditorAssetRecord = Awaited<ReturnType<typeof prisma.asset.findMany>>[number];
type ResolvedEditorAssetRecord = EditorAssetRecord & { resolvedUrl: string | null };

const RECENT_ASSETS_LIMIT = 12;

export async function loadEditorAssets(projectId: string, scenes: readonly SceneRefs[]) {
  const recent = await loadRecentAssets(projectId);
  const missingIds = collectMissingIds(scenes, recent);
  const referenced = missingIds.length ? await loadAssetsByIds(missingIds) : [];
  const assets = await resolveAssetUrls(mergeAssets(recent, referenced));
  return {
    recent: assets,
    byId: indexById(assets)
  };
}

async function loadRecentAssets(projectId: string) {
  return prisma.asset.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: RECENT_ASSETS_LIMIT
  });
}

async function loadAssetsByIds(ids: readonly string[]) {
  return prisma.asset.findMany({ where: { id: { in: [...ids] } } });
}

function collectMissingIds(scenes: readonly SceneRefs[], recent: readonly EditorAssetRecord[]) {
  const known = new Set(recent.map((asset) => asset.id));
  const ids = new Set<string>();
  scenes.forEach((scene) => {
    addIfMissing(ids, known, scene.startFrameAssetId);
    addIfMissing(ids, known, scene.videoAssetId);
    addIfMissing(ids, known, scene.endFrameAssetId);
  });
  return [...ids];
}

function addIfMissing(target: Set<string>, known: Set<string>, id: string | null) {
  if (id && !known.has(id)) target.add(id);
}

function indexById(assets: readonly ResolvedEditorAssetRecord[]) {
  return new Map(assets.map((asset) => [asset.id, asset]));
}

function mergeAssets(first: readonly EditorAssetRecord[], second: readonly EditorAssetRecord[]) {
  const seen = new Set<string>();
  return [...first, ...second].filter((asset) => {
    if (seen.has(asset.id)) return false;
    seen.add(asset.id);
    return true;
  });
}

async function resolveAssetUrls(assets: readonly EditorAssetRecord[]) {
  return Promise.all(assets.map(resolveAssetUrl));
}

async function resolveAssetUrl(asset: EditorAssetRecord): Promise<ResolvedEditorAssetRecord> {
  return { ...asset, resolvedUrl: await safeSignedAssetUrl(asset) };
}

async function safeSignedAssetUrl(asset: EditorAssetRecord) {
  try {
    return await signedAssetUrl(asset);
  } catch {
    return null;
  }
}

async function signedAssetUrl(asset: EditorAssetRecord) {
  return resolveAssetReadUrl(asset);
}
