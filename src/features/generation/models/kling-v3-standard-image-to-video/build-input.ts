import type { FalInputContext } from "../types";

const defaultNegativePrompt = "blur, distort, and low quality";

export function buildKlingV3StandardImageToVideoInput(context: FalInputContext) {
  if (!context.video || !context.imageUrl) throw new Error("Video input is required");
  return {
    prompt: context.video.prompt,
    start_image_url: context.imageUrl,
    ...(context.endImageUrl ? { end_image_url: context.endImageUrl } : {}),
    duration: `${context.video.duration}`,
    generate_audio: context.video.generateAudio ?? true,
    negative_prompt: context.video.negativePrompt ?? defaultNegativePrompt,
    cfg_scale: context.video.cfgScale ?? 0.5
  };
}
