import type { ReasoningModel } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";

export type ReasoningUsage = {
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  totalTokens: number;
};

export async function recordReasoningUsage(model: ReasoningModel, usage: ReasoningUsage) {
  const cost = estimateCost(model, usage);
  return prisma.reasoningModel.update({
    where: { id: model.id },
    data: {
      promptTokensUsed: { increment: usage.promptTokens },
      completionTokensUsed: { increment: usage.completionTokens },
      reasoningTokensUsed: { increment: usage.reasoningTokens },
      totalTokensUsed: { increment: usage.totalTokens },
      requestCount: { increment: 1 },
      estimatedCostUsd: { increment: cost }
    }
  });
}

function estimateCost(model: ReasoningModel, usage: ReasoningUsage) {
  const input = usage.promptTokens * model.inputTokenPriceUsdPerMillion;
  const output = outputTokens(usage) * model.outputTokenPriceUsdPerMillion;
  return (input + output) / 1_000_000;
}

function outputTokens(usage: ReasoningUsage) {
  const totalOutput = usage.totalTokens - usage.promptTokens;
  if (totalOutput > 0) return totalOutput;
  return usage.completionTokens + usage.reasoningTokens;
}
