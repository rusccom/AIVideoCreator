import type { ModelDefinition, ResolutionPriceMap } from "../server/model-registry";
import type { ResolvedGenerateVideoInput } from "../server/generation-schema";

export type SupportedModelDefinition = Omit<ModelDefinition, "pricePerSecondByResolution"> & {
  defaultPricePerSecondByResolution: ResolutionPriceMap;
  inputAdapter: string;
  imageDefaults?: ImageModelDefaults;
};

export type ImageModelDefaults = {
  defaultNumImages: number;
  maxImagesPerRequest?: number;
  supportedImageSizes?: string[];
  defaultImageSize?: string;
  supportedQualities?: string[];
  defaultQuality?: string;
  supportedOutputFormats: string[];
  defaultOutputFormat: string;
  safetyToleranceLevels?: string[];
  defaultSafetyTolerance?: string;
  defaultLimitGenerations?: boolean;
  defaultEnableWebSearch?: boolean;
  supportedThinkingLevels?: string[];
  defaultThinkingLevel?: string;
};

export type FalInputContext = {
  endImageUrl?: string;
  image?: FalImageInput;
  imageUrl?: string;
  video?: ResolvedGenerateVideoInput;
};

export type FalInputBuilder = (context: FalInputContext) => Record<string, unknown>;

export type FalImageInput = {
  prompt: string;
  numImages?: number;
  seed?: number;
  aspectRatio?: string;
  imageSize?: string | { width: number; height: number };
  quality?: string;
  outputFormat?: string;
  safetyTolerance?: string;
  systemPrompt?: string;
  resolution?: string;
  limitGenerations?: boolean;
  enableWebSearch?: boolean;
  thinkingLevel?: string;
};
