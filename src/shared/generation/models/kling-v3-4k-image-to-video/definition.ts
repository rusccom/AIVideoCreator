import type { SupportedModelDefinition } from "../types";

export const klingV34kImageToVideoDefinition = {
  id: "kling-v3-4k-image-to-video",
  provider: "fal",
  providerModelId: "fal-ai/kling-video/v3/4k/image-to-video",
  type: "image-to-video",
  displayName: "Kling V3 4K Image To Video",
  qualityTier: "premium",
  supportedAspectRatios: ["auto"],
  supportedResolutions: ["4k"],
  defaultAspectRatio: "auto",
  defaultResolution: "4k",
  defaultPricePerSecondByResolution: { "4k": 20 },
  minDurationSeconds: 3,
  maxDurationSeconds: 15,
  defaultDurationSeconds: 5,
  supportsStartFrame: true,
  supportsEndFrame: true,
  supportsSeed: false,
  active: true,
  inputAdapter: "kling-v3-4k-image-to-video"
} satisfies SupportedModelDefinition;
