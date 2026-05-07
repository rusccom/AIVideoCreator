"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/features/auth/server/admin-auth";
import { parseAiModelForm } from "./ai-model-form";
import { updateAiModel } from "./ai-model-service";

export async function updateAiModelAction(formData: FormData) {
  await requireAdminUser();
  await updateAiModel(parseAiModelForm(formData));
  refreshOwnerModels();
}

function refreshOwnerModels() {
  revalidatePath("/owner/models");
  revalidatePath("/admin");
}
