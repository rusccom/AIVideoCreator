import { prisma } from "@/shared/server/prisma";

type SceneRefs = {
  startFrameAssetId: string | null;
  videoAssetId: string | null;
  endFrameAssetId: string | null;
};

type EditorAssetRecord = Awaited<ReturnType<typeof prisma.asset.findMany>>[number];

const RECENT_ASSETS_LIMIT = 12;

export async function loadEditorAssets(projectId: string, scenes: readonly SceneRefs[]) {
  const recent = await loadRecentAssets(projectId);
  const missingIds = collectMissingIds(scenes, recent);
  const referenced = missingIds.length ? await loadAssetsByIds(missingIds) : [];
  return {
    recent: mergeAssets(recent, referenced),
    byId: indexById([...recent, ...referenced])
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

function indexById(assets: readonly EditorAssetRecord[]) {
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
