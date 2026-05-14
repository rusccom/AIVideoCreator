"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/application/auth/server";
import { parseAiModelForm } from "@/features/admin/server/ai-model-form";
import { updateAiModel } from "@/features/admin/server/ai-model-service";

export async function updateAiModelAction(formData: FormData) {
  await requireAdminUser();
  await updateAiModel(parseAiModelForm(formData));
  refreshOwnerModels();
}

function refreshOwnerModels() {
  revalidatePath("/owner/models");
  revalidatePath("/admin");
}
