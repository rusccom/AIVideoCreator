export type ReasoningTokenStats = {
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  requestCount: number;
  estimatedCostUsd: number;
};

export type EditableReasoningModel = {
  id?: string;
  key: string;
  provider: string;
  providerModelId: string;
  displayName: string;
  contextWindowTokens: number;
  inputTokenPriceUsdPerMillion: number;
  outputTokenPriceUsdPerMillion: number;
  reasoningEffort: string;
  excludeReasoning: boolean;
  active: boolean;
  selected: boolean;
  stats: ReasoningTokenStats;
};
