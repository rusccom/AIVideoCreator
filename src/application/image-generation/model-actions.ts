"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/application/auth/server";
import { updateImageModel } from "@/features/image-generation/server/image-model-service";

export async function updateImageModelAction(formData: FormData) {
  await requireAdminUser();
  await updateImageModel({
    active: formData.has("active"),
    aiCreatorImageCount: numberValue(formData, "aiCreatorImageCount"),
    id: value(formData, "id"),
    key: value(formData, "key")
  });
  refreshImageModels();
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function numberValue(formData: FormData, key: string) {
  return Number(value(formData, key));
}

function refreshImageModels() {
  revalidatePath("/owner/models");
  revalidatePath("/owner/image-models");
}
