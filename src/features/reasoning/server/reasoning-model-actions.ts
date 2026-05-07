"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/features/auth/server/admin-auth";
import { parseReasoningModelForm } from "./reasoning-model-form";
import { updateReasoningModel } from "./reasoning-model-service";

export async function updateReasoningModelAction(formData: FormData) {
  await requireAdminUser();
  await updateReasoningModel(parseReasoningModelForm(formData));
  refreshReasoningPanels();
}

function refreshReasoningPanels() {
  revalidatePath("/owner/models");
  revalidatePath("/admin");
}
