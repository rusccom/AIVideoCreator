"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/features/auth/server/admin-auth";
import { parseBillingSettingsForm } from "./billing-owner-form";
import { updateBillingSettings } from "./billing-settings-service";

export async function updateBillingSettingsAction(formData: FormData) {
  await requireAdminUser();
  const input = parseBillingSettingsForm(formData);
  await updateBillingSettings(input.creditsPerUsd);
  refreshBillingPages();
}

function refreshBillingPages() {
  revalidatePath("/owner/billing");
  revalidatePath("/app/billing");
}
