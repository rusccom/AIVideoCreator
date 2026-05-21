import type { FalInputContext } from "./types";

export function buildSeedance2ReferenceVideoInput(context: FalInputContext) {
  if (!context.video || !context.imageUrl) throw new Error("Video input is required");
  return {
    prompt: context.video.prompt,
    image_urls: [context.imageUrl],
    resolution: context.video.resolution,
    duration: `${context.video.duration}`,
    aspect_ratio: context.video.aspectRatio,
    generate_audio: context.video.generateAudio ?? true,
    ...(context.video.seed !== undefined ? { seed: context.video.seed } : {})
  };
}
