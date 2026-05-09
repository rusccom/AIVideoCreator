import type { SupportedModelDefinition } from "../types";

export const gemini31FlashImageDefinition = {
  id: "gemini-3-1-flash-image",
  provider: "fal",
  providerModelId: "fal-ai/nano-banana-2",
  type: "text-to-image",
  displayName: "Gemini 3.1 Flash Image",
  qualityTier: "fast",
  supportedAspectRatios: ["auto", "21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16", "4:1", "1:4", "8:1", "1:8"],
  supportedResolutions: ["0.5K", "1K", "2K", "4K"],
  defaultAspectRatio: "auto",
  defaultResolution: "1K",
  defaultPricePerSecondByResolution: {},
  minDurationSeconds: 1,
  maxDurationSeconds: 1,
  defaultDurationSeconds: 1,
  supportsStartFrame: false,
  supportsEndFrame: false,
  supportsSeed: true,
  active: true,
  inputAdapter: "gemini-3-1-flash-image",
  imageDefaults: {
    defaultNumImages: 1,
    maxImagesPerRequest: 4,
    supportedOutputFormats: ["jpeg", "png", "webp"],
    defaultOutputFormat: "png",
    safetyToleranceLevels: ["1", "2", "3", "4", "5", "6"],
    defaultSafetyTolerance: "4",
    defaultLimitGenerations: true,
    defaultEnableWebSearch: false,
    supportedThinkingLevels: ["off", "minimal", "high"],
    defaultThinkingLevel: "off"
  }
} satisfies SupportedModelDefinition;
