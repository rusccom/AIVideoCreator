"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/application/auth/server";
import { parseReasoningModelForm } from "@/features/reasoning/server/reasoning-model-form";
import { updateReasoningModel } from "@/features/reasoning/server/reasoning-model-service";

export async function updateReasoningModelAction(formData: FormData) {
  await requireAdminUser();
  await updateReasoningModel(parseReasoningModelForm(formData));
  refreshReasoningPanels();
}

function refreshReasoningPanels() {
  revalidatePath("/owner/models");
  revalidatePath("/admin");
}
