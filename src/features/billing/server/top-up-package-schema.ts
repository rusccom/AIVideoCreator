import { z } from "zod";

export const topUpPackageSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(2).max(60).regex(/^[a-z0-9_]+$/, "Use lowercase letters, digits and underscores"),
  label: z.string().min(1).max(60),
  amountCents: z.number().int().min(50).max(100000000),
  bonusCredits: z.number().int().min(0).max(100000000),
  popular: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000)
});

export type TopUpPackageInput = z.infer<typeof topUpPackageSchema>;

export function parseTopUpPackageForm(formData: FormData): TopUpPackageInput {
  return topUpPackageSchema.parse({
    id: optionalString(formData.get("id")),
    key: String(formData.get("key") ?? ""),
    label: String(formData.get("label") ?? ""),
    amountCents: Math.round(Number(formData.get("amountUsd")) * 100),
    bonusCredits: Number(formData.get("bonusCredits") ?? 0),
    popular: formData.has("popular"),
    active: formData.has("active"),
    sortOrder: Number(formData.get("sortOrder") ?? 0)
  });
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return text.length > 0 ? text : undefined;
}
