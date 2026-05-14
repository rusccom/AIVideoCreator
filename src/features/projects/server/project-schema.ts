import { z } from "zod";
import {
  COMMON_ASPECT_RATIO_PRESETS,
  defaultAspectRatioPreset
} from "@/shared/generation/models";

const aspectRatioValues = COMMON_ASPECT_RATIO_PRESETS.map((item) => item.value) as [string, ...string[]];

export const createProjectSchema = z.object({
  title: z.string().min(1).max(120),
  aspectRatio: z.enum(aspectRatioValues).default(defaultAspectRatioPreset().value)
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "EXPORTING"]).optional()
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
