import { prisma } from "@/shared/server/prisma";
import { getSupportedModel } from "@/features/generation/models/catalog";

type UpdateImageModelInput = {
  active: boolean;
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
    data: { active: input.active }
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
