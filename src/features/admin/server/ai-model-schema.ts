import { z } from "zod";

export const aiModelSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(2).max(120),
  pricePerSecondByResolution: z.record(z.string(), z.number().int().min(0)),
  minDurationSeconds: z.number().int().positive(),
  maxDurationSeconds: z.number().int().positive(),
  defaultDurationSeconds: z.number().int().positive(),
  active: z.boolean()
}).superRefine((input, context) => {
  if (input.minDurationSeconds > input.maxDurationSeconds) {
    context.addIssue({ code: "custom", path: ["minDurationSeconds"], message: "Min duration must be lower than max duration" });
  }
  if (input.defaultDurationSeconds < input.minDurationSeconds) {
    context.addIssue({ code: "custom", path: ["defaultDurationSeconds"], message: "Default duration is below minimum" });
  }
  if (input.defaultDurationSeconds > input.maxDurationSeconds) {
    context.addIssue({ code: "custom", path: ["defaultDurationSeconds"], message: "Default duration is above maximum" });
  }
});

export type AiModelInput = z.infer<typeof aiModelSchema>;
