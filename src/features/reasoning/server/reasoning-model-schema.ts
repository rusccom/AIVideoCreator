import { z } from "zod";

export const reasoningEffortSchema = z.enum(["xhigh", "high", "medium", "low", "minimal", "none"]);

export const reasoningModelSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(2).max(120),
  active: z.boolean(),
  selected: z.boolean(),
  reasoningEffort: reasoningEffortSchema,
  excludeReasoning: z.boolean()
}).superRefine((input, context) => {
  if (input.selected && !input.active) {
    context.addIssue({ code: "custom", path: ["selected"], message: "Selected model must be active" });
  }
});

export type ReasoningModelInput = z.infer<typeof reasoningModelSchema>;
