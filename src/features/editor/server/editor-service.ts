import { prisma } from "@/shared/server/prisma";
import { supportedModels } from "@/features/generation/models/catalog";
import {
  modelActive,
  modelImageCount,
  modelPriceMap,
  modelStatsByKey,
  type ModelStats
} from "@/features/generation/server/model-stats-service";
import type { SupportedModelDefinition } from "@/features/generation/models/types";
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
  const models = supportedModels.filter((model) => model.type === type);
  const stats = await modelStatsByKey(models.map((model) => model.id));
  return models.filter((model) => modelActive(model, stats.get(model.id))).map((model) => mapper(model, stats.get(model.id)));
}

function toEditorScene(
  scene: Awaited<ReturnType<typeof getSceneType>>,
  assets: Map<string, ResolvedAssetRecord>
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
    startFrameAssetId: scene.startFrameAssetId,
    generationJobId: scene.generationJobId,
    startFrameUrl: assetUrl(assets.get(scene.startFrameAssetId ?? "")),
    videoUrl: assetUrl(assets.get(scene.videoAssetId ?? "")),
    endFrameUrl: assetUrl(assets.get(scene.endFrameAssetId ?? "")),
    endFrameAssetId: scene.endFrameAssetId,
    linkState: scene.isStale ? "Needs relink" : "Linked"
  } satisfies EditorScene;
}

function toEditorAsset(asset: ResolvedAssetRecord) {
  return {
    id: asset.id,
    label: `${asset.type.toLowerCase()} - ${asset.source.toLowerCase()}`,
    type: asset.type,
    url: assetUrl(asset)
  } satisfies EditorAsset;
}

function toTimelineItem(
  item: Awaited<ReturnType<typeof getTimelineItemType>>,
  assets: Map<string, ResolvedAssetRecord>
) {
  return {
    id: item.id,
    sceneId: item.sceneId,
    orderIndex: item.orderIndex,
    durationSeconds: item.durationSeconds ?? item.scene.durationSeconds,
    scene: toEditorScene(item.scene, assets)
  } satisfies EditorTimelineItem;
}

function toVideoModel(model: SupportedModelDefinition, stats?: ModelStats) {
  return {
    id: model.id,
    displayName: model.displayName,
    defaultAspectRatio: model.defaultAspectRatio,
    defaultDurationSeconds: model.defaultDurationSeconds,
    defaultResolution: model.defaultResolution,
    maxDurationSeconds: model.maxDurationSeconds,
    minDurationSeconds: model.minDurationSeconds,
    pricePerSecondByResolution: modelPriceMap(model, stats),
    supportedAspectRatios: model.supportedAspectRatios,
    supportedResolutions: model.supportedResolutions
  } satisfies EditorVideoModel;
}

function toImageModel(model: SupportedModelDefinition, stats?: ModelStats) {
  return {
    id: model.id,
    displayName: model.displayName,
    aiCreatorImageCount: modelImageCount(model, stats),
    defaultAspectRatio: model.defaultAspectRatio,
    defaultResolution: model.defaultResolution,
    maxImagesPerRequest: model.imageDefaults?.maxImagesPerRequest ?? 4,
    supportedAspectRatios: model.supportedAspectRatios,
    supportedResolutions: model.supportedResolutions
  } satisfies EditorImageModel;
}

function assetUrl(asset?: ResolvedAssetRecord) {
  return asset?.resolvedUrl ?? null;
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function totalTimelineSeconds(items: Array<{ durationSeconds: number }>) {
  return items.reduce((total, item) => total + item.durationSeconds, 0);
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

type ModelMapper<T> = (model: SupportedModelDefinition, stats?: ModelStats) => T;
type ResolvedAssetRecord = Awaited<ReturnType<typeof getAssetType>> & { resolvedUrl?: string | null };
