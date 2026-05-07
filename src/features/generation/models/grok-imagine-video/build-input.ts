import type { FalInputContext } from "../types";

export function buildGrokImagineVideoInput(context: FalInputContext) {
  if (!context.video || !context.imageUrl) throw new Error("Video input is required");
  return {
    prompt: context.video.prompt,
    image_url: context.imageUrl,
    duration: context.video.duration,
    aspect_ratio: context.video.aspectRatio,
    resolution: context.video.resolution
  };
}
