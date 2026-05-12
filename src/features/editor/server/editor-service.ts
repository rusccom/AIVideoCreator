import { prisma } from "@/shared/server/prisma";
import { supportedModels } from "@/features/generation/models/catalog";
import type { EditorAsset, EditorImageModel, EditorProject, EditorScene, EditorTimelineItem, EditorVideoModel } from "../types";
import { loadEditorAssets } from "./asset-loader";

export async function getEditorProject(
  userId: string,
  projectId: string
): Promise<EditorProject | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      scenes: { orderBy: { orderIndex: "asc" } },
      timelineItems: { include: { scene: true }, orderBy: { orderIndex: "asc" } }
    }
  });
  if (!project) return null;
  const assets = await loadEditorAssets(project.id, project.scenes);
  const timelineItems = project.timelineItems.map((item) => toTimelineItem(item, assets.byId));
  const videoModels = await listModels("image-to-video", toVideoModel);
  const imageModels = await listModels("text-to-image", toImageModel);
  return {
    id: project.id,
    title: project.title,
    aspectRatio: project.aspectRatio,
    totalDuration: `${totalTimelineSeconds(timelineItems)}s`,
    scenes: project.scenes.map((scene) => toEditorScene(scene, assets.byId)),
    timelineItems,
    assets: assets.recent.map(toEditorAsset),
    imageModels,
    videoModels
  };
}

async function listModels<T>(type: string, mapper: ModelMapper<T>) {
  const keys = supportedModels.filter((model) => model.type === type).map((model) => model.id);
  const models = await prisma.aiModel.findMany({
    where: { active: true, key: { in: keys }, type },
    orderBy: { displayName: "asc" }
  });
  return models.map(mapper).filter(isModel);
}

function toEditorScene(
  scene: Awaited<ReturnType<typeof getSceneType>>,
  assets: Map<string, Awaited<ReturnType<typeof getAssetType>>>
) {
  return {
    id: scene.id,
    name: `Scene ${String(scene.orderIndex + 1).padStart(2, "0")}`,
    status: titleCase(scene.status),
    statusValue: scene.status,
    duration: `${scene.durationSeconds}s`,
    durationSeconds: scene.durationSeconds,
    model: scene.modelId,
    modelId: scene.modelId,
    prompt: scene.userPrompt,
    aiPrompt: scene.aiPrompt ?? "No enhanced prompt yet.",
    startFrameAssetId: scene.startFrameAssetId,
    generationJobId: scene.generationJobId,
    startFrameUrl: assetUrl(assets.get(scene.startFrameAssetId ?? "")),
    videoUrl: assetUrl(assets.get(scene.videoAssetId ?? "")),
    endFrameUrl: assetUrl(assets.get(scene.endFrameAssetId ?? "")),
    linkState: scene.isStale ? "Needs relink" : "Linked"
  } satisfies EditorScene;
}

function toEditorAsset(asset: Awaited<ReturnType<typeof getAssetType>>) {
  return {
    id: asset.id,
    label: `${asset.type.toLowerCase()} - ${asset.source.toLowerCase()}`,
    type: asset.type,
    url: assetUrl(asset)
  } satisfies EditorAsset;
}

function toTimelineItem(
  item: Awaited<ReturnType<typeof getTimelineItemType>>,
  assets: Map<string, Awaited<ReturnType<typeof getAssetType>>>
) {
  return {
    id: item.id,
    sceneId: item.sceneId,
    orderIndex: item.orderIndex,
    durationSeconds: item.durationSeconds ?? item.scene.durationSeconds,
    scene: toEditorScene(item.scene, assets)
  } satisfies EditorTimelineItem;
}

function toVideoModel(model: Awaited<ReturnType<typeof prisma.aiModel.findMany>>[number]) {
  const supported = supportedModels.find((item) => item.id === model.key);
  if (!supported) return null;
  return {
    id: supported.id,
    displayName: supported.displayName,
    defaultAspectRatio: supported.defaultAspectRatio,
    defaultDurationSeconds: model.defaultDurationSeconds,
    defaultResolution: supported.defaultResolution,
    maxDurationSeconds: model.maxDurationSeconds,
    minDurationSeconds: model.minDurationSeconds,
    pricePerSecondByResolution: priceMap(model.pricePerSecondByResolution, supported.supportedResolutions),
    supportedAspectRatios: supported.supportedAspectRatios,
    supportedResolutions: supported.supportedResolutions
  } satisfies EditorVideoModel;
}

function toImageModel(model: Awaited<ReturnType<typeof prisma.aiModel.findMany>>[number]) {
  const supported = supportedModels.find((item) => item.id === model.key);
  if (!supported) return null;
  return {
    id: supported.id,
    displayName: supported.displayName,
    defaultAspectRatio: supported.defaultAspectRatio,
    defaultResolution: supported.defaultResolution,
    maxImagesPerRequest: supported.imageDefaults?.maxImagesPerRequest ?? 4,
    supportedAspectRatios: supported.supportedAspectRatios,
    supportedResolutions: supported.supportedResolutions
  } satisfies EditorImageModel;
}

function assetUrl(asset?: Awaited<ReturnType<typeof getAssetType>>) {
  if (!asset) return null;
  if (asset.storageProvider !== "r2" && !asset.storageKey.startsWith("http")) return null;
  return `/api/assets/${asset.id}/signed-url`;
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function totalTimelineSeconds(items: Array<{ durationSeconds: number }>) {
  return items.reduce((total, item) => total + item.durationSeconds, 0);
}

function priceMap(value: unknown, resolutions: string[]) {
  const source = jsonRecord(value);
  return Object.fromEntries(resolutions.map((item) => [item, Number(source[item] ?? 0)]));
}

function jsonRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

async function getSceneType() {
  return prisma.scene.findFirstOrThrow();
}

async function getAssetType() {
  return prisma.asset.findFirstOrThrow();
}

async function getTimelineItemType() {
  return prisma.timelineItem.findFirstOrThrow({ include: { scene: true } });
}

function isModel<T>(model: T | null): model is T {
  return Boolean(model);
}

type ModelMapper<T> = (model: Awaited<ReturnType<typeof prisma.aiModel.findMany>>[number]) => T | null;
