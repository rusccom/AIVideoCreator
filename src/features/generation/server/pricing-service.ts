import type { GenerateVideoInput, ResolvedGenerateVideoInput } from "./generation-schema";
import type { ModelDefinition } from "./model-registry";

export function resolveVideoInput(
  model: ModelDefinition,
  input: GenerateVideoInput
): ResolvedGenerateVideoInput {
  const duration = input.duration ?? model.defaultDurationSeconds;
  const resolution = input.resolution ?? model.defaultResolution;
  const aspectRatio = input.aspectRatio ?? model.defaultAspectRatio;
  assertDuration(model, duration);
  assertResolution(model, resolution);
  assertAspectRatio(model, aspectRatio);
  return {
    ...input,
    duration,
    resolution,
    aspectRatio
  } as ResolvedGenerateVideoInput;
}

export function estimateVideoCredits(model: ModelDefinition, input: ResolvedGenerateVideoInput) {
  const price = model.pricePerSecondByResolution[input.resolution] ?? 0;
  if (price <= 0) throw new Error("Model price is not configured");
  return Math.ceil(input.duration * price);
}

function assertDuration(model: ModelDefinition, duration: number) {
  const min = model.minDurationSeconds;
  const max = model.maxDurationSeconds;
  if (duration < min || duration > max) {
    throw new Error(`Duration must be between ${min} and ${max} seconds`);
  }
}

function assertResolution(model: ModelDefinition, resolution: string) {
  if (!model.supportedResolutions.includes(resolution)) {
    throw new Error("Resolution is not supported by model");
  }
}

function assertAspectRatio(model: ModelDefinition, aspectRatio: string) {
  if (!model.supportedAspectRatios.includes(aspectRatio)) {
    throw new Error("Aspect ratio is not supported by model");
  }
}
