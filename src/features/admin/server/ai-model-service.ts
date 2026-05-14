import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { supportedModels } from "@/shared/generation/models";
import {
  modelActive,
  modelImageCount,
  modelPriceMap,
  modelStatsByKey,
  type ModelStats
} from "@/shared/server/model-stats";
import type { EditableAiModel } from "@/shared/model-form";
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
  return { ...model, active: modelActive(model, stats), aiCreatorImageCount: modelImageCount(model, stats), id: model.id, key: model.id, lastUsedAt: stats?.lastUsedAt ?? null, pricePerSecondByResolution: modelPriceMap(model, stats), usageGeneratedImages: stats?.usageGeneratedImages ?? 0, usageRequestCount: stats?.usageRequestCount ?? 0 } satisfies EditableAiModel;
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
