import { prisma } from "@/shared/server/prisma";
import { supportedModels } from "@/shared/generation/models";

export type ModelMarginRow = {
  modelId: string;
  displayName: string;
  requests: number;
  revenueCredits: number;
  providerCostUsd: number;
};

type GroupRow = {
  modelId: string;
  _count: { _all: number };
  _sum: { creditsSpent: number | null; providerCostEstimate: number | null };
};

export async function getModelMarginReport(): Promise<ModelMarginRow[]> {
  const grouped = await prisma.generationJob.groupBy({
    by: ["modelId"],
    _sum: { creditsSpent: true, providerCostEstimate: true },
    _count: { _all: true }
  });
  return grouped.map(toMarginRow).sort((a, b) => b.revenueCredits - a.revenueCredits);
}

function toMarginRow(row: GroupRow): ModelMarginRow {
  return {
    modelId: row.modelId,
    displayName: displayName(row.modelId),
    requests: row._count._all,
    revenueCredits: row._sum.creditsSpent ?? 0,
    providerCostUsd: row._sum.providerCostEstimate ?? 0
  };
}

function displayName(modelId: string) {
  return supportedModels.find((model) => model.id === modelId)?.displayName ?? modelId;
}
