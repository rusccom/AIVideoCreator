export type ModelType = "image-to-video" | "text-to-image";
export type ResolutionPriceMap = Record<string, number>;

export type ModelDefinition = {
  active: boolean;
  defaultAspectRatio: string;
  defaultDurationSeconds: number;
  defaultResolution: string;
  displayName: string;
  id: string;
  maxDurationSeconds: number;
  minDurationSeconds: number;
  pricePerSecondByResolution: ResolutionPriceMap;
  provider: "fal";
  providerModelId: string;
  qualityTier: "fast" | "balanced" | "premium";
  supportedAspectRatios: string[];
  supportedResolutions: string[];
  supportsEndFrame: boolean;
  supportsSeed: boolean;
  supportsStartFrame: boolean;
  type: ModelType;
};

export type GenerateVideoInput = {
  aspectRatio?: string;
  cfgScale?: number;
  duration?: number;
  generateAudio?: boolean;
  modelId: string;
  negativePrompt?: string;
  prompt: string;
  resolution?: string;
  seed?: number;
};

export type ResolvedGenerateVideoInput = GenerateVideoInput & {
  aspectRatio: string;
  duration: number;
  resolution: string;
};
