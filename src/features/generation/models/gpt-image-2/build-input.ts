import type { FalImageInput, FalInputContext } from "../types";

export function buildGptImage2Input(context: FalInputContext) {
  if (!context.image) throw new Error("Image generation input is required");
  return imageInput(context.image);
}

function imageInput(input: FalImageInput) {
  return {
    prompt: input.prompt,
    image_size: input.imageSize ?? "landscape_4_3",
    quality: input.quality ?? "high",
    num_images: input.numImages ?? 1,
    output_format: input.outputFormat ?? "png"
  };
}
