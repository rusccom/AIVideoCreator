import type { SupportedModelDefinition } from "../types";

export const seedance2FastReferenceToVideoDefinition = {
  id: "seedance-2-fast-reference-to-video",
  provider: "fal",
  providerModelId: "bytedance/seedance-2.0/fast/reference-to-video",
  type: "image-to-video",
  displayName: "Seedance 2.0 Fast Reference To Video",
  qualityTier: "fast",
  supportedAspectRatios: ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
  supportedResolutions: ["480p", "720p"],
  defaultAspectRatio: "auto",
  defaultResolution: "720p",
  defaultPricePerSecondByResolution: { "480p": 5, "720p": 7 },
  providerCostPerSecondUsdByResolution: { "480p": 0.02, "720p": 0.03 },
  minDurationSeconds: 4,
  maxDurationSeconds: 15,
  defaultDurationSeconds: 6,
  supportsStartFrame: true,
  supportsEndFrame: false,
  supportsSeed: true,
  active: true,
  inputAdapter: "seedance-2-fast-reference-to-video"
} satisfies SupportedModelDefinition;
