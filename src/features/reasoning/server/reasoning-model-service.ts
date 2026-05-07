import { prisma } from "@/shared/server/prisma";
import { supportedReasoningModels } from "../models/catalog";
import type { EditableReasoningModel } from "../types";
import type { ReasoningModelInput } from "./reasoning-model-schema";

export async function listReasoningModels(): Promise<EditableReasoningModel[]> {
  const models = await prisma.reasoningModel.findMany({
    where: { key: { in: supportedReasoningModels.map((model) => model.id) } },
    orderBy: [{ provider: "asc" }, { displayName: "asc" }]
  });
  return models.map(toEditableModel);
}

export async function getSelectedReasoningModel() {
  const selected = await prisma.reasoningModel.findFirst({
    where: { selected: true, active: true }
  });
  if (selected) return selected;
  return fallbackReasoningModel();
}

export async function updateReasoningModel(input: ReasoningModelInput) {
  const supported = supportedReasoningModels.find((model) => model.id === input.key);
  if (!input.id || !supported) throw new Error("Unsupported reasoning model");
  await applyReasoningModelUpdate(input, supported);
  await ensureSelectedReasoningModel();
}

async function applyReasoningModelUpdate(
  input: ReasoningModelInput,
  model: (typeof supportedReasoningModels)[number]
) {
  if (!input.selected) return updateStoredReasoningModel(input, model);
  await prisma.$transaction([
    prisma.reasoningModel.updateMany({ data: { selected: false } }),
    updateStoredReasoningModel(input, model)
  ]);
}

function updateStoredReasoningModel(
  input: ReasoningModelInput,
  model: (typeof supportedReasoningModels)[number]
) {
  return prisma.reasoningModel.update({
    where: { id: input.id },
    data: {
      ...lockedModelData(model),
      active: input.active,
      selected: input.selected,
      reasoningEffort: input.reasoningEffort,
      excludeReasoning: input.excludeReasoning
    }
  });
}

async function ensureSelectedReasoningModel() {
  await prisma.reasoningModel.updateMany({
    where: { active: false, selected: true },
    data: { selected: false }
  });
  const selected = await getActiveSelectedModel();
  if (!selected) await selectFirstActiveModel();
}

async function getActiveSelectedModel() {
  return prisma.reasoningModel.findFirst({ where: { active: true, selected: true } });
}

async function selectFirstActiveModel() {
  const fallback = await prisma.reasoningModel.findFirst({
    where: { active: true },
    orderBy: { displayName: "asc" }
  });
  if (fallback) await prisma.reasoningModel.update({ where: { id: fallback.id }, data: { selected: true } });
}

async function fallbackReasoningModel() {
  const model = await prisma.reasoningModel.findFirst({
    where: { active: true },
    orderBy: { displayName: "asc" }
  });
  if (!model) throw new Error("Reasoning model is not configured");
  return model;
}

function lockedModelData(model: (typeof supportedReasoningModels)[number]) {
  return {
    provider: model.provider,
    providerModelId: model.providerModelId,
    displayName: model.displayName,
    contextWindowTokens: model.contextWindowTokens,
    inputTokenPriceUsdPerMillion: model.inputTokenPriceUsdPerMillion,
    outputTokenPriceUsdPerMillion: model.outputTokenPriceUsdPerMillion
  };
}

function toEditableModel(model: Awaited<ReturnType<typeof prisma.reasoningModel.findMany>>[number]) {
  return {
    ...model,
    stats: {
      promptTokens: model.promptTokensUsed,
      completionTokens: model.completionTokensUsed,
      reasoningTokens: model.reasoningTokensUsed,
      totalTokens: model.totalTokensUsed,
      requestCount: model.requestCount,
      estimatedCostUsd: model.estimatedCostUsd
    }
  } satisfies EditableReasoningModel;
}
