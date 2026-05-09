import { DEFAULT_IMAGES_PER_SCENE } from "./config";
import { imageBatchSize } from "./ai-creator-state";
import { generateProjectImageAssets } from "@/features/image-generation/client/project-image-client";
import type { AiCreatorImageModel } from "./types";

export type GeneratedCreatorAsset = {
  id: string;
  url: string;
};

type GenerateCreatorImagesInput = {
  aspectRatio: string;
  imageModel: AiCreatorImageModel;
  onBatch: (startIndex: number, count: number, assets: GeneratedCreatorAsset[]) => void;
  projectId: string;
  prompt: string;
};

export async function generateCreatorImages(input: GenerateCreatorImagesInput) {
  await Promise.all(imageBatches(DEFAULT_IMAGES_PER_SCENE, imageBatchSize(input.imageModel)).map((batch) => {
    return requestImageBatch(input, batch.count)
      .then((assets) => input.onBatch(batch.startIndex, batch.count, assets))
      .catch(() => input.onBatch(batch.startIndex, batch.count, []));
  }));
}

function imageBatches(total: number, batchSize: number) {
  const batches = [];
  for (let startIndex = 0; startIndex < total; startIndex += batchSize) {
    batches.push({ startIndex, count: Math.min(batchSize, total - startIndex) });
  }
  return batches;
}

async function requestImageBatch(input: GenerateCreatorImagesInput, count: number) {
  const assets = await generateProjectImageAssets(input.projectId, requestBody(input, count));
  if (!assets.length) throw new Error("Image generation returned no assets.");
  return assets;
}

function requestBody(input: GenerateCreatorImagesInput, count: number) {
  return {
    aspectRatio: input.aspectRatio,
    modelId: input.imageModel.id,
    numImages: count,
    prompt: input.prompt,
    resolution: input.imageModel.defaultResolution
  };
}
