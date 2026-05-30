import { z } from "zod";

export const STORYBOARD_MIN_PANELS = 6;
export const STORYBOARD_MAX_PANELS = 12;
export const STORYBOARD_MIN_DURATION = 6;
export const STORYBOARD_MAX_DURATION = 15;

export const storyboardDraftSchema = z.object({
  aspectRatio: z.string().min(1).max(24).optional(),
  character: z.string().trim().min(1).max(800),
  durationSeconds: z.number().int().min(STORYBOARD_MIN_DURATION).max(STORYBOARD_MAX_DURATION),
  idea: z.string().trim().min(1).max(2000),
  panelCount: z.number().int().min(STORYBOARD_MIN_PANELS).max(STORYBOARD_MAX_PANELS)
});

export type StoryboardDraftInput = z.infer<typeof storyboardDraftSchema>;
