import { z } from "zod";

export const createSceneSchema = z.object({
  prompt: z.string().min(1).max(2000),
  modelId: z.string().min(2).max(120),
  durationSeconds: z.number().int().min(1).max(60).optional(),
  startFrameAssetId: z.string().optional(),
  parentSceneId: z.string().optional(),
  branchEntityId: z.string().optional()
});

export const updateSceneSchema = z.object({
  userPrompt: z.string().min(1).max(2000).optional(),
  modelId: z.string().min(2).max(120).optional(),
  status: z.enum(["DRAFT", "QUEUED", "GENERATING", "READY", "FAILED", "STALE"]).optional()
});

export const pickFrameSchema = z.object({
  frameTimeSeconds: z.number().min(0).max(6)
});

export type CreateSceneInput = z.infer<typeof createSceneSchema>;
export type UpdateSceneInput = z.infer<typeof updateSceneSchema>;
export type PickFrameInput = z.infer<typeof pickFrameSchema>;
