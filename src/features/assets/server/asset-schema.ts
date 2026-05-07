import { z } from "zod";

export const uploadUrlSchema = z.object({
  projectId: z.string().optional(),
  mimeType: z.string().min(3).max(120),
  fileName: z.string().min(1).max(180),
  type: z.enum(["IMAGE", "VIDEO", "FRAME", "THUMBNAIL", "EXPORT"]).default("IMAGE")
});

export type UploadUrlInput = z.infer<typeof uploadUrlSchema>;
