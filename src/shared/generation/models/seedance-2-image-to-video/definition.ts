import type { SupportedModelDefinition } from "../types";

export const seedance2ImageToVideoDefinition = {
  id: "seedance-2-image-to-video",
  provider: "fal",
  providerModelId: "bytedance/seedance-2.0/image-to-video",
  type: "image-to-video",
  displayName: "Seedance 2.0 Image To Video",
  qualityTier: "premium",
  supportedAspectRatios: ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
  supportedResolutions: ["480p", "720p", "1080p"],
  defaultAspectRatio: "auto",
  defaultResolution: "720p",
  defaultPricePerSecondByResolution: { "480p": 5, "720p": 8, "1080p": 12 },
  minDurationSeconds: 4,
  maxDurationSeconds: 15,
  defaultDurationSeconds: 6,
  supportsStartFrame: true,
  supportsEndFrame: true,
  supportsSeed: true,
  active: true,
  inputAdapter: "seedance-2-image-to-video"
} satisfies SupportedModelDefinition;
