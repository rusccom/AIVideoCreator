import type { SupportedModelDefinition } from "../types";

export const grokImagineVideoDefinition = {
  id: "grok-imagine-video",
  provider: "fal",
  providerModelId: "xai/grok-imagine-video/image-to-video",
  type: "image-to-video",
  displayName: "Grok Imagine Video",
  qualityTier: "premium",
  supportedAspectRatios: ["auto", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"],
  supportedResolutions: ["480p", "720p"],
  defaultAspectRatio: "auto",
  defaultResolution: "720p",
  defaultPricePerSecondByResolution: { "480p": 5, "720p": 7 },
  minDurationSeconds: 2,
  maxDurationSeconds: 15,
  defaultDurationSeconds: 6,
  supportsStartFrame: true,
  supportsEndFrame: false,
  supportsSeed: false,
  active: true,
  inputAdapter: "grok-imagine-video"
} satisfies SupportedModelDefinition;
