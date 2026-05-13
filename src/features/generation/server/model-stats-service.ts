import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import type { SupportedModelDefinition } from "../models/types";

export type ModelStats = {
  active: boolean;
  aiCreatorImageCount: number;
  key: string;
  lastUsedAt: Date | null;
  pricePerSecondOverride: Prisma.JsonValue | null;
  usageGeneratedImages: number;
  usageRequestCount: number;
};

export type ModelStatsInput = {
  active: boolean;
  aiCreatorImageCount: number;
  key: string;
};

export async function modelStatsByKey(keys: readonly string[]) {
  const stats = await prisma.aiModelStats.findMany({ where: { key: { in: [...keys] } } });
  return new Map(stats.map((item) => [item.key, item]));
}

export async function modelStatsForKey(key: string) {
  return prisma.aiModelStats.findUnique({ where: { key } });
}

export function modelActive(model: SupportedModelDefinition, stats?: ModelStats | null) {
  return stats?.active ?? model.active;
}

export function modelPriceMap(model: SupportedModelDefinition, stats?: ModelStats | null) {
  const source = jsonRecord(stats?.pricePerSecondOverride ?? model.defaultPricePerSecondByResolution);
  return Object.fromEntries(model.supportedResolutions.map((item) => [item, Number(source[item] ?? 0)]));
}

export function modelImageCount(model: SupportedModelDefinition, stats?: ModelStats | null) {
  return stats?.aiCreatorImageCount ?? model.imageDefaults?.defaultNumImages ?? 4;
}

export function updateModelStats(input: ModelStatsInput) {
  return prisma.aiModelStats.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      active: input.active,
      aiCreatorImageCount: input.aiCreatorImageCount
    },
    update: {
      active: input.active,
      aiCreatorImageCount: input.aiCreatorImageCount
    }
  });
}

export function recordModelUsage(modelKey: string, generatedImages: number) {
  return prisma.aiModelStats.upsert({
    where: { key: modelKey },
    create: usageCreateData(modelKey, generatedImages),
    update: usageUpdateData(generatedImages)
  });
}

function usageCreateData(modelKey: string, generatedImages: number) {
  return {
    key: modelKey,
    usageRequestCount: 1,
    usageGeneratedImages: generatedImages,
    lastUsedAt: new Date()
  };
}

function usageUpdateData(generatedImages: number) {
  return {
    usageRequestCount: { increment: 1 },
    usageGeneratedImages: { increment: generatedImages },
    lastUsedAt: new Date()
  };
}

function jsonRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
