import { z } from "zod";

export const createExportSchema = z.object({
  projectId: z.string().min(1),
  range: z.enum(["full", "selected"]).default("full"),
  format: z.enum(["mp4"]).default("mp4"),
  resolution: z.enum(["720p", "1080p", "4k"]).default("1080p"),
  includeAudio: z.boolean().default(false)
});

export type CreateExportInput = z.infer<typeof createExportSchema>;
