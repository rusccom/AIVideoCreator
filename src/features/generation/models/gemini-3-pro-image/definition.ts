import type { SupportedModelDefinition } from "../types";

export const gemini3ProImageDefinition = {
  id: "gemini-3-pro-image",
  provider: "fal",
  providerModelId: "fal-ai/nano-banana-pro",
  type: "text-to-image",
  displayName: "Gemini 3 Pro Image",
  qualityTier: "premium",
  supportedAspectRatios: ["auto", "21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16"],
  supportedResolutions: ["1K", "2K", "4K"],
  defaultAspectRatio: "1:1",
  defaultResolution: "1K",
  defaultPricePerSecondByResolution: {},
  minDurationSeconds: 1,
  maxDurationSeconds: 1,
  defaultDurationSeconds: 1,
  supportsStartFrame: false,
  supportsEndFrame: false,
  supportsSeed: true,
  active: true,
  inputAdapter: "gemini-3-pro-image",
  imageDefaults: {
    defaultNumImages: 1,
    supportedOutputFormats: ["jpeg", "png", "webp"],
    defaultOutputFormat: "png",
    safetyToleranceLevels: ["1", "2", "3", "4", "5", "6"],
    defaultSafetyTolerance: "4",
    defaultEnableWebSearch: false
  }
} satisfies SupportedModelDefinition;
