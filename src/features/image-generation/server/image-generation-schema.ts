import { z } from "zod";

export const generateProjectImageSchema = z.object({
  aspectRatio: z.string().min(1).max(24).optional(),
  modelId: z.string().min(2).max(120),
  numImages: z.number().int().min(1).max(4).default(1),
  prompt: z.string().min(1).max(2000),
  resolution: z.string().min(1).max(32).optional()
});

export type GenerateProjectImageInput = z.infer<typeof generateProjectImageSchema>;
