import { getSupportedModel } from "@/features/generation/models/catalog";
import { recordModelUsage, updateModelStats } from "@/features/generation/server/model-stats-service";

type UpdateImageModelInput = {
  active: boolean;
  aiCreatorImageCount: number;
  id: string;
  key: string;
};

export async function updateImageModel(input: UpdateImageModelInput) {
  const supported = getSupportedModel(input.key);
  if (supported?.type !== "text-to-image") {
    throw new Error("Unsupported image model");
  }
  return updateModelStats({ active: input.active, aiCreatorImageCount: imageCount(input.aiCreatorImageCount), key: input.key });
}

export function recordImageModelUsage(modelKey: string, generatedImages: number) {
  return recordModelUsage(modelKey, generatedImages);
}

function imageCount(value: number) {
  if (!Number.isFinite(value)) return 4;
  return Math.max(1, Math.min(Math.round(value), 12));
}
