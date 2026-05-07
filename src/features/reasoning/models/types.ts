export type SupportedReasoningModel = {
  id: string;
  provider: "openrouter";
  providerModelId: string;
  displayName: string;
  contextWindowTokens: number;
  inputTokenPriceUsdPerMillion: number;
  outputTokenPriceUsdPerMillion: number;
  reasoningEffort: string;
  excludeReasoning: boolean;
  active: boolean;
  selected: boolean;
};
