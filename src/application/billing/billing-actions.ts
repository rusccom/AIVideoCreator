"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/application/auth/server";
import {
  parseTopUpPackageForm,
  type TopUpPackageInput
} from "@/features/billing/server/top-up-package-schema";
import {
  createTopUpPackage,
  deleteTopUpPackage,
  updateTopUpPackage,
  type TopUpPackageWriteInput
} from "@/features/billing/server/top-up-package-service";

export async function createTopUpPackageAction(formData: FormData) {
  await requireAdminUser();
  await createTopUpPackage(writeData(parseTopUpPackageForm(formData)));
  revalidatePath("/owner/billing");
}

export async function updateTopUpPackageAction(formData: FormData) {
  await requireAdminUser();
  const input = parseTopUpPackageForm(formData);
  if (!input.id) throw new Error("Package id is required");
  await updateTopUpPackage(input.id, writeData(input));
  revalidatePath("/owner/billing");
}

export async function deleteTopUpPackageAction(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Package id is required");
  await deleteTopUpPackage(id);
  revalidatePath("/owner/billing");
}

function writeData(input: TopUpPackageInput): TopUpPackageWriteInput {
  return {
    key: input.key,
    label: input.label,
    amountCents: input.amountCents,
    bonusCredits: input.bonusCredits,
    popular: input.popular,
    active: input.active,
    sortOrder: input.sortOrder
  };
}
