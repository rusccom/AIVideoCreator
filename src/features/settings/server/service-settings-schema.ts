import { z } from "zod";

export const serviceSettingsSchema = z.object({
  creditsPerUsd: z.number().int().min(1).max(100000),
  welcomeCredits: z.number().int().min(0).max(1000000)
});

export type ServiceSettingsFormInput = z.infer<typeof serviceSettingsSchema>;

export function parseServiceSettingsForm(formData: FormData): ServiceSettingsFormInput {
  return serviceSettingsSchema.parse({
    creditsPerUsd: Number(formData.get("creditsPerUsd")),
    welcomeCredits: Number(formData.get("welcomeCredits"))
  });
}
