import { z } from "zod";

export const createTimelineItemSchema = z.object({
  index: z.number().int().min(0).optional(),
  sceneId: z.string().min(1)
});

export const reorderTimelineSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1)
});

export type CreateTimelineItemInput = z.infer<typeof createTimelineItemSchema>;
export type ReorderTimelineInput = z.infer<typeof reorderTimelineSchema>;
