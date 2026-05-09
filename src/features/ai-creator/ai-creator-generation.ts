import { DEFAULT_IMAGES_PER_SCENE } from "./config";
import { imageBatchSize } from "./ai-creator-state";
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
  const response = await fetch(`/api/projects/${input.projectId}/images/generate`, requestOptions(input, count));
  if (!response.ok) throw new Error("Image generation failed.");
  const data = await response.json() as { assets?: GeneratedCreatorAsset[] };
  if (!data.assets?.length) throw new Error("Image generation returned no assets.");
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
