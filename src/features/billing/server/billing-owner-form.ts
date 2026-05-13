import { billingSettingsSchema } from "./billing-schema";

export function parseBillingSettingsForm(formData: FormData) {
  return billingSettingsSchema.parse({
    creditsPerUsd: formData.get("creditsPerUsd")
  });
}
