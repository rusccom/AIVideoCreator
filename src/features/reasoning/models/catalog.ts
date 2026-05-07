import { openAiGpt55ReasoningDefinition } from "./openai-gpt-5-5/definition";

export const supportedReasoningModels = [
  openAiGpt55ReasoningDefinition
];

export function getSupportedReasoningModel(modelId: string) {
  return supportedReasoningModels.find((model) => model.id === modelId) ?? null;
}
