import { z } from "zod";

export const aiCreatorPromptSchema = z.object({
  prompt: z.string().trim().min(1).max(2000)
});

export type AiCreatorPromptInput = z.infer<typeof aiCreatorPromptSchema>;
