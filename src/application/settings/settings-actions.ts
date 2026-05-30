"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/application/auth/server";
import { parseServiceSettingsForm } from "@/features/settings/server/service-settings-schema";
import { updateServiceSettings } from "@/shared/server/service-settings";

export async function updateServiceSettingsAction(formData: FormData) {
  await requireAdminUser();
  await updateServiceSettings(parseServiceSettingsForm(formData));
  revalidatePath("/owner/billing");
}
