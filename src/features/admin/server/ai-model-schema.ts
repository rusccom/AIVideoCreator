import { z } from "zod";

export const aiModelSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(2).max(120),
  pricePerSecondByResolution: z.record(z.string(), z.number().int().min(0)),
  active: z.boolean()
});

export type AiModelInput = z.infer<typeof aiModelSchema>;
