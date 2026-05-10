import { z } from "zod";

export const aiCreatorVideoSchema = z.object({
  assetId: z.string().min(1),
  aspectRatio: z.string().min(1).max(24).optional(),
  duration: z.number().int().positive(),
  modelId: z.string().min(2).max(120),
  prompt: z.string().min(1).max(2000),
  resolution: z.string().min(1).max(32).optional()
});

export type AiCreatorVideoInput = z.infer<typeof aiCreatorVideoSchema>;
