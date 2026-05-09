import { z } from "zod";

export const aiCreatorSceneDraftSchema = z.object({
  aspectRatio: z.string().min(1).max(24).optional(),
  durationSeconds: z.number().int().min(10).max(600),
  idea: z.string().trim().min(1).max(2000),
  imageModelId: z.string().min(2).max(120).optional(),
  videoModelId: z.string().min(2).max(120).optional()
});

export type AiCreatorSceneDraftInput = z.infer<typeof aiCreatorSceneDraftSchema>;
