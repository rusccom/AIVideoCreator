import type { SupportedModelDefinition } from "../types";

export const gptImage2Definition = {
  id: "gpt-image-2",
  provider: "fal",
  providerModelId: "openai/gpt-image-2",
  referenceProviderModelId: "openai/gpt-image-2/edit",
  type: "text-to-image",
  displayName: "GPT Image 2",
  qualityTier: "premium",
  supportedAspectRatios: ["21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16"],
  supportedResolutions: [],
  defaultAspectRatio: "4:3",
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
    aspectRatioMode: "image_size",
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
