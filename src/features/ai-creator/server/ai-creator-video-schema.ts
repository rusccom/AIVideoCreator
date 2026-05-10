import { z } from "zod";

const aiCreatorVideoSceneSchema = z.object({
  duration: z.number().int().positive(),
  prompt: z.string().min(1).max(2000)
});

export const aiCreatorVideoSchema = z.object({
  assetId: z.string().min(1),
  aspectRatio: z.string().min(1).max(24).optional(),
  duration: z.number().int().positive(),
  modelId: z.string().min(2).max(120),
  prompt: z.string().min(1).max(2000),
  resolution: z.string().min(1).max(32).optional(),
  scenes: z.array(aiCreatorVideoSceneSchema).min(1).max(60).optional()
});

export type AiCreatorVideoInput = z.infer<typeof aiCreatorVideoSchema>;
export type AiCreatorVideoSceneInput = z.infer<typeof aiCreatorVideoSceneSchema>;
