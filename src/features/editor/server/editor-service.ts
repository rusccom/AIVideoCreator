import { prisma } from "@/shared/server/prisma";
import { supportedModels } from "@/features/generation/models/catalog";
import type { EditorAsset, EditorImageModel, EditorProject, EditorScene, EditorVideoModel } from "../types";

export async function getEditorProject(
  userId: string,
  projectId: string
): Promise<EditorProject | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      assets: { orderBy: { createdAt: "desc" }, take: 12 },
      scenes: { orderBy: { orderIndex: "asc" } }
    }
  });
  if (!project) return null;
  const videoModels = await listModels("image-to-video", toVideoModel);
  const imageModels = await listModels("text-to-image", toImageModel);
  const assetsById = new Map(project.assets.map((asset) => [asset.id, asset]));
  return {
    id: project.id,
    title: project.title,
    description: project.description ?? "",
    totalDuration: `${totalSceneSeconds(project.scenes)}s`,
    scenes: project.scenes.map((scene) => toEditorScene(scene, assetsById)),
    assets: project.assets.map(toEditorAsset),
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

function totalSceneSeconds(scenes: Array<{ durationSeconds: number }>) {
  return scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
}

async function getSceneType() {
  return prisma.scene.findFirstOrThrow();
}

async function getAssetType() {
  return prisma.asset.findFirstOrThrow();
}

function isModel<T>(model: T | null): model is T {
  return Boolean(model);
}

type ModelMapper<T> = (model: Awaited<ReturnType<typeof prisma.aiModel.findMany>>[number]) => T | null;
