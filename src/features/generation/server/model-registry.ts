import { getSupportedModel } from "@/shared/generation/models";
import type { SupportedModelDefinition } from "@/shared/generation/models";
import { modelActive, modelPriceMap, modelStatsForKey, type ModelStats } from "@/shared/server/model-stats";

export type ModelType = "image-to-video" | "text-to-image";
export type ResolutionPriceMap = Record<string, number>;

export type ModelDefinition = {
  id: string;
  provider: "fal";
  providerModelId: string;
  type: ModelType;
  displayName: string;
  qualityTier: "fast" | "balanced" | "premium";
  supportedAspectRatios: string[];
  supportedResolutions: string[];
  defaultAspectRatio: string;
  defaultResolution: string;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  defaultDurationSeconds: number;
  supportsStartFrame: boolean;
  supportsEndFrame: boolean;
  supportsSeed: boolean;
  pricePerSecondByResolution: ResolutionPriceMap;
  active: boolean;
};

export async function getModel(modelId: string) {
  const supported = getSupportedModel(modelId);
  if (!supported) throw new Error("Model is not available");
  const stats = await modelStatsForKey(modelId);
  if (!modelActive(supported, stats)) throw new Error("Model is not available");
  if (supported.type !== "image-to-video") {
    throw new Error("Model is not a video generation model");
  }
  return mergeModel(supported, stats);
}

function mergeModel(supported: SupportedModelDefinition, stats: ModelStats | null) {
  return {
    ...supported,
    pricePerSecondByResolution: modelPriceMap(supported, stats),
    active: modelActive(supported, stats)
  } satisfies ModelDefinition;
}
