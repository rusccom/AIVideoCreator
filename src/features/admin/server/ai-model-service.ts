import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { supportedModels } from "@/features/generation/models/catalog";
import {
  modelActive,
  modelImageCount,
  modelPriceMap,
  modelStatsByKey,
  type ModelStats
} from "@/features/generation/server/model-stats-service";
import type { EditableAiModel } from "@/features/owner/types";
import type { AiModelInput } from "./ai-model-schema";

export async function listAiModels(): Promise<EditableAiModel[]> {
  const stats = await modelStatsByKey(supportedModels.map((model) => model.id));
  return supportedModels.map((model) => editableModel(model, stats.get(model.id)));
}

export async function updateAiModel(input: AiModelInput) {
  const supported = supportedModels.find((model) => model.id === input.key);
  if (!supported) throw new Error("Unsupported model");
  return prisma.aiModelStats.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      active: input.active,
      pricePerSecondOverride: asJson(input.pricePerSecondByResolution)
    },
    update: {
      active: input.active,
      pricePerSecondOverride: asJson(input.pricePerSecondByResolution)
    }
  });
}

function editableModel(
  model: (typeof supportedModels)[number],
  stats?: ModelStats
): EditableAiModel {
  return {
    id: model.id,
    key: model.id,
    provider: model.provider,
    providerModelId: model.providerModelId,
    type: model.type,
    displayName: model.displayName,
    qualityTier: model.qualityTier,
    supportedAspectRatios: model.supportedAspectRatios,
    supportedResolutions: model.supportedResolutions,
    supportsStartFrame: model.supportsStartFrame,
    supportsEndFrame: model.supportsEndFrame,
    supportsSeed: model.supportsSeed,
    defaultAspectRatio: model.defaultAspectRatio,
    defaultDurationSeconds: model.defaultDurationSeconds,
    defaultResolution: model.defaultResolution,
    imageDefaults: model.imageDefaults,
    minDurationSeconds: model.minDurationSeconds,
    maxDurationSeconds: model.maxDurationSeconds,
    pricePerSecondByResolution: modelPriceMap(model, stats),
    active: modelActive(model, stats),
    aiCreatorImageCount: modelImageCount(model, stats),
    lastUsedAt: stats?.lastUsedAt ?? null,
    usageGeneratedImages: stats?.usageGeneratedImages ?? 0,
    usageRequestCount: stats?.usageRequestCount ?? 0
  } satisfies EditableAiModel;
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
