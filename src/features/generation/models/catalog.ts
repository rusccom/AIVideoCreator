import { gemini31FlashImageDefinition } from "./gemini-3-1-flash-image/definition";
import { gemini3ProImageDefinition } from "./gemini-3-pro-image/definition";
import { gptImage2Definition } from "./gpt-image-2/definition";
import { grokImagineVideoDefinition } from "./grok-imagine-video/definition";
import { klingV34kImageToVideoDefinition } from "./kling-v3-4k-image-to-video/definition";
import { klingV3ProImageToVideoDefinition } from "./kling-v3-pro-image-to-video/definition";
import { klingV3StandardImageToVideoDefinition } from "./kling-v3-standard-image-to-video/definition";
import { seedance2ImageToVideoDefinition } from "./seedance-2-image-to-video/definition";
import type { SupportedModelDefinition } from "./types";

export const supportedModels: SupportedModelDefinition[] = [
  gemini31FlashImageDefinition,
  gemini3ProImageDefinition,
  gptImage2Definition,
  grokImagineVideoDefinition,
  klingV34kImageToVideoDefinition,
  klingV3ProImageToVideoDefinition,
  klingV3StandardImageToVideoDefinition,
  seedance2ImageToVideoDefinition
];

export function getSupportedModel(modelId: string) {
  return supportedModels.find((model) => model.id === modelId) ?? null;
}
