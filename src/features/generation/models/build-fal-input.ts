import { buildGemini31FlashImageInput } from "./gemini-3-1-flash-image/build-input";
import { buildGemini3ProImageInput } from "./gemini-3-pro-image/build-input";
import { buildGptImage2Input } from "./gpt-image-2/build-input";
import { buildGrokImagineVideoInput } from "./grok-imagine-video/build-input";
import { buildKlingV34kImageToVideoInput } from "./kling-v3-4k-image-to-video/build-input";
import { buildKlingV3ProImageToVideoInput } from "./kling-v3-pro-image-to-video/build-input";
import { buildKlingV3StandardImageToVideoInput } from "./kling-v3-standard-image-to-video/build-input";
import { buildSeedance2ImageToVideoInput } from "./seedance-2-image-to-video/build-input";
import { getSupportedModel } from "./catalog";
import { normalizeImageAspectRatio } from "./image-aspect-ratio";
import type { FalInputBuilder, FalInputContext } from "./types";

const falInputBuilders: Record<string, FalInputBuilder> = {
  "gemini-3-1-flash-image": buildGemini31FlashImageInput,
  "gemini-3-pro-image": buildGemini3ProImageInput,
  "gpt-image-2": buildGptImage2Input,
  "grok-imagine-video": buildGrokImagineVideoInput,
  "kling-v3-4k-image-to-video": buildKlingV34kImageToVideoInput,
  "kling-v3-pro-image-to-video": buildKlingV3ProImageToVideoInput,
  "kling-v3-standard-image-to-video": buildKlingV3StandardImageToVideoInput,
  "seedance-2-image-to-video": buildSeedance2ImageToVideoInput
};

export function buildFalInput(modelId: string, context: FalInputContext) {
  const builder = falInputBuilders[modelId];
  if (!builder) throw new Error("FAL input adapter is not implemented");
  return builder(normalizedContext(modelId, context));
}

function normalizedContext(modelId: string, context: FalInputContext) {
  const model = getSupportedModel(modelId);
  if (!context.image || model?.type !== "text-to-image") return context;
  return { ...context, image: normalizeImageAspectRatio(context.image, model) };
}
