import { z } from "zod";

const aspectRatioSchema = z.string().min(1).max(24);
const resolutionSchema = z.string().min(1).max(32);

export const selectStartImageSchema = z.object({
  assetId: z.string().min(1)
});

export const generateVideoSchema = z.object({
  prompt: z.string().min(1).max(2000),
  modelId: z.string().default("grok-imagine-video"),
  duration: z.number().int().positive().optional(),
  aspectRatio: aspectRatioSchema.optional(),
  resolution: resolutionSchema.optional(),
  generateAudio: z.boolean().optional(),
  seed: z.number().int().optional(),
  negativePrompt: z.string().max(1200).optional(),
  cfgScale: z.number().min(0).max(1).optional()
});

export type SelectStartImageInput = z.infer<typeof selectStartImageSchema>;
export type GenerateVideoInput = z.infer<typeof generateVideoSchema>;
export type ResolvedGenerateVideoInput = GenerateVideoInput & {
  duration: number;
  aspectRatio: string;
  resolution: string;
};
