import type { SupportedReasoningModel } from "../types";

export const openAiGpt55ReasoningDefinition = {
  id: "openai-gpt-5-5",
  provider: "openrouter",
  providerModelId: "openai/gpt-5.5",
  displayName: "OpenAI GPT-5.5",
  contextWindowTokens: 1050000,
  inputTokenPriceUsdPerMillion: 5,
  outputTokenPriceUsdPerMillion: 30,
  reasoningEffort: "medium",
  excludeReasoning: true,
  active: true,
  selected: true
} satisfies SupportedReasoningModel;
