import type { SupportedModelDefinition } from "../types";

export const klingV3ProImageToVideoDefinition = {
  id: "kling-v3-pro-image-to-video",
  provider: "fal",
  providerModelId: "fal-ai/kling-video/v3/pro/image-to-video",
  type: "image-to-video",
  displayName: "Kling V3 Pro Image To Video",
  qualityTier: "premium",
  supportedAspectRatios: ["auto"],
  supportedResolutions: ["pro"],
  defaultAspectRatio: "auto",
  defaultResolution: "pro",
  defaultPricePerSecondByResolution: { pro: 12 },
  minDurationSeconds: 3,
  maxDurationSeconds: 15,
  defaultDurationSeconds: 5,
  supportsStartFrame: true,
  supportsEndFrame: true,
  supportsSeed: false,
  active: true,
  inputAdapter: "kling-v3-pro-image-to-video"
} satisfies SupportedModelDefinition;
