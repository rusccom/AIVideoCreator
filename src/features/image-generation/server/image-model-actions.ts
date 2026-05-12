"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/features/auth/server/admin-auth";
import { updateImageModel } from "./image-model-service";

export async function updateImageModelAction(formData: FormData) {
  await requireAdminUser();
  await updateImageModel({
    id: value(formData, "id"),
    key: value(formData, "key"),
    aiCreatorImageCount: numberValue(formData, "aiCreatorImageCount"),
    active: formData.has("active")
  });
  refresh();
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function numberValue(formData: FormData, key: string) {
  return Number(value(formData, key));
}

function refresh() {
  revalidatePath("/owner/models");
  revalidatePath("/owner/image-models");
}
