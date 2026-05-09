import type { SupportedModelDefinition } from "../types";

export const gptImage2Definition = {
  id: "gpt-image-2",
  provider: "fal",
  providerModelId: "openai/gpt-image-2",
  type: "text-to-image",
  displayName: "GPT Image 2",
  qualityTier: "premium",
  supportedAspectRatios: [],
  supportedResolutions: [],
  defaultAspectRatio: "landscape_4_3",
  defaultResolution: "high",
  defaultPricePerSecondByResolution: {},
  minDurationSeconds: 1,
  maxDurationSeconds: 1,
  defaultDurationSeconds: 1,
  supportsStartFrame: false,
  supportsEndFrame: false,
  supportsSeed: false,
  active: true,
  inputAdapter: "gpt-image-2",
  imageDefaults: {
    defaultNumImages: 1,
    maxImagesPerRequest: 4,
    supportedImageSizes: ["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"],
    defaultImageSize: "landscape_4_3",
    supportedQualities: ["low", "medium", "high"],
    defaultQuality: "high",
    supportedOutputFormats: ["jpeg", "png", "webp"],
    defaultOutputFormat: "png"
  }
} satisfies SupportedModelDefinition;
