import type { SupportedModelDefinition } from "../types";

export const klingV3StandardImageToVideoDefinition = {
  id: "kling-v3-standard-image-to-video",
  provider: "fal",
  providerModelId: "fal-ai/kling-video/v3/standard/image-to-video",
  type: "image-to-video",
  displayName: "Kling V3 Standard Image To Video",
  qualityTier: "balanced",
  supportedAspectRatios: ["auto"],
  supportedResolutions: ["standard"],
  defaultAspectRatio: "auto",
  defaultResolution: "standard",
  defaultPricePerSecondByResolution: { standard: 8 },
  minDurationSeconds: 3,
  maxDurationSeconds: 15,
  defaultDurationSeconds: 5,
  supportsStartFrame: true,
  supportsEndFrame: true,
  supportsSeed: false,
  active: true,
  inputAdapter: "kling-v3-standard-image-to-video"
} satisfies SupportedModelDefinition;
