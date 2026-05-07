import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { getSupportedModel } from "../models/catalog";
import type { SupportedModelDefinition } from "../models/types";

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
  const model = await prisma.aiModel.findFirst({
    where: { key: modelId, active: true }
  });
  const supported = getSupportedModel(modelId);
  if (!model || !supported) {
    throw new Error("Model is not available");
  }
  if (supported.type !== "image-to-video") {
    throw new Error("Model is not a video generation model");
  }
  return mergeModel(supported, model);
}

type StoredModel = {
  pricePerSecondByResolution: Prisma.JsonValue;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  defaultDurationSeconds: number;
  active: boolean;
};

function mergeModel(supported: SupportedModelDefinition, model: StoredModel) {
  return {
    ...supported,
    pricePerSecondByResolution: priceMap(model, supported.supportedResolutions),
    minDurationSeconds: model.minDurationSeconds,
    maxDurationSeconds: model.maxDurationSeconds,
    defaultDurationSeconds: model.defaultDurationSeconds,
    active: model.active
  } satisfies ModelDefinition;
}

function priceMap(model: StoredModel, resolutions: string[]) {
  const source = jsonRecord(model.pricePerSecondByResolution);
  return Object.fromEntries(resolutions.map((item) => [item, Number(source[item] ?? 0)]));
}

function jsonRecord(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
