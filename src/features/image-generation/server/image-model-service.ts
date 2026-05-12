import { prisma } from "@/shared/server/prisma";
import { getSupportedModel } from "@/features/generation/models/catalog";

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
  return prisma.aiModel.update({
    where: { id: input.id },
    data: { active: input.active, aiCreatorImageCount: imageCount(input.aiCreatorImageCount) }
  });
}

export function recordImageModelUsage(modelKey: string, generatedImages: number) {
  return prisma.aiModel.update({
    where: { key: modelKey },
    data: {
      usageRequestCount: { increment: 1 },
      usageGeneratedImages: { increment: generatedImages },
      lastUsedAt: new Date()
    }
  });
}

function imageCount(value: number) {
  if (!Number.isFinite(value)) return 4;
  return Math.max(1, Math.min(Math.round(value), 12));
}
