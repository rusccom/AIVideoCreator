import type { FalImageInput, FalInputContext } from "../types";
import { falImageAspectInput, falReferenceImageInput } from "../image-aspect-ratio";

export function buildGemini31FlashImageInput(context: FalInputContext) {
  if (!context.image) throw new Error("Image generation input is required");
  return imageInput(context.image);
}

function imageInput(input: FalImageInput) {
  return {
    prompt: input.prompt,
    num_images: input.numImages ?? 1,
    ...falImageAspectInput(input),
    output_format: input.outputFormat ?? "png",
    safety_tolerance: input.safetyTolerance ?? "4",
    resolution: input.resolution ?? "1K",
    limit_generations: input.limitGenerations ?? true,
    ...falReferenceImageInput(input),
    ...optionalInput(input)
  };
}

function optionalInput(input: FalImageInput) {
  return {
    ...(input.seed === undefined ? {} : { seed: input.seed }),
    ...(input.systemPrompt ? { system_prompt: input.systemPrompt } : {}),
    ...(input.enableWebSearch ? { enable_web_search: true } : {}),
    ...(thinkingLevel(input))
  };
}

function thinkingLevel(input: FalImageInput) {
  if (!input.thinkingLevel || input.thinkingLevel === "off") return {};
  return { thinking_level: input.thinkingLevel };
}
