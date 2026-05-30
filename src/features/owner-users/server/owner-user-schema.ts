import { z } from "zod";

export const adjustCreditsSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().refine((value) => value !== 0, "Amount must be non-zero"),
  reason: z.string().min(1).max(120)
});

export type AdjustCreditsInput = z.infer<typeof adjustCreditsSchema>;

export function parseAdjustCreditsForm(formData: FormData): AdjustCreditsInput {
  return adjustCreditsSchema.parse({
    userId: String(formData.get("userId") ?? ""),
    amount: Number(formData.get("amount")),
    reason: String(formData.get("reason") ?? "")
  });
}
