import { DEFAULT_IMAGES_PER_SCENE } from "./config";
import { imageBatchSize } from "./ai-creator-state";
import type { AiCreatorImageModel } from "./types";

export type GeneratedCreatorAsset = {
  id: string;
  storageKey: string;
};

type GenerateCreatorImagesInput = {
  aspectRatio: string;
  imageModel: AiCreatorImageModel;
  onBatch: (startIndex: number, assets: GeneratedCreatorAsset[]) => void;
  projectId: string;
  prompt: string;
};

export async function generateCreatorImages(input: GenerateCreatorImagesInput) {
  const batches = imageBatches(DEFAULT_IMAGES_PER_SCENE, imageBatchSize(input.imageModel));
  let startIndex = 0;
  for (const count of batches) {
    const assets = await requestImageBatch(input, count);
    input.onBatch(startIndex, assets);
    startIndex += count;
  }
}

function imageBatches(total: number, batchSize: number) {
  const batches = [];
  for (let remaining = total; remaining > 0; remaining -= batchSize) {
    batches.push(Math.min(batchSize, remaining));
  }
  return batches;
}

async function requestImageBatch(input: GenerateCreatorImagesInput, count: number) {
  const response = await fetch(`/api/projects/${input.projectId}/images/generate`, requestOptions(input, count));
  if (!response.ok) throw new Error("Image generation failed.");
  const data = await response.json() as { assets?: GeneratedCreatorAsset[] };
  return data.assets ?? [];
}

function requestOptions(input: GenerateCreatorImagesInput, count: number) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody(input, count))
  };
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
