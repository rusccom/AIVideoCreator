import { z } from "zod";
import { topUpPackageKeys } from "../data/top-up-packages";

export const checkoutSchema = z.object({
  packageKey: z.enum(topUpPackageKeys)
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const billingSettingsSchema = z.object({
  creditsPerUsd: z.coerce.number().int().min(1).max(100000)
});

export type BillingSettingsInput = z.infer<typeof billingSettingsSchema>;
