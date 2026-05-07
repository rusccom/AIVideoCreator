import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { supportedModels } from "@/features/generation/models/catalog";
import type { EditableAiModel } from "@/features/owner/types";
import type { AiModelInput } from "./ai-model-schema";

export async function listAiModels(): Promise<EditableAiModel[]> {
  const models = await prisma.aiModel.findMany({
    where: { key: { in: supportedModels.map((model) => model.id) } },
    orderBy: [{ provider: "asc" }, { type: "asc" }, { displayName: "asc" }]
  });
  return models.map(mergeSupportedFields).filter(isEditableModel);
}

export async function updateAiModel(input: AiModelInput) {
  if (!input.id) throw new Error("Model id is required");
  const supported = supportedModels.find((model) => model.id === input.key);
  if (!supported) throw new Error("Unsupported model");
  return prisma.aiModel.update({
    where: { id: input.id },
    data: {
      ...lockedModelData(supported),
      active: input.active,
      pricePerSecondByResolution: asJson(input.pricePerSecondByResolution),
      minDurationSeconds: input.minDurationSeconds,
      maxDurationSeconds: input.maxDurationSeconds,
      defaultDurationSeconds: input.defaultDurationSeconds
    }
  });
}

function lockedModelData(model: (typeof supportedModels)[number]) {
  return {
    provider: model.provider,
    providerModelId: model.providerModelId,
    type: model.type,
    displayName: model.displayName,
    qualityTier: model.qualityTier,
    supportedAspectRatios: model.supportedAspectRatios,
    supportedResolutions: model.supportedResolutions,
    supportsStartFrame: model.supportsStartFrame,
    supportsEndFrame: model.supportsEndFrame,
    supportsSeed: model.supportsSeed
  };
}

function mergeSupportedFields(
  model: Awaited<ReturnType<typeof prisma.aiModel.findMany>>[number]
): EditableAiModel | null {
  const supported = supportedModels.find((item) => item.id === model.key);
  if (!supported) return null;
  return {
    ...model,
    ...lockedModelData(supported),
    defaultAspectRatio: supported.defaultAspectRatio,
    defaultResolution: supported.defaultResolution,
    imageDefaults: supported.imageDefaults,
    pricePerSecondByResolution: priceMap(model.pricePerSecondByResolution, supported.supportedResolutions)
  } satisfies EditableAiModel;
}

function priceMap(value: Prisma.JsonValue, resolutions: string[]) {
  const source = jsonRecord(value);
  return Object.fromEntries(resolutions.map((item) => [item, Number(source[item] ?? 0)]));
}

function jsonRecord(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function isEditableModel(model: EditableAiModel | null): model is EditableAiModel {
  return Boolean(model);
}
