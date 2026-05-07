import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1).max(120),
  aspectRatio: z.string().min(3).max(40),
  stylePreset: z.string().min(2).max(40),
  quality: z.string().min(2).max(40),
  idea: z.string().min(1).max(2000),
  frameSource: z.string().min(2).max(80)
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "EXPORTING"]).optional()
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
