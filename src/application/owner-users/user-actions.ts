"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/application/auth/server";
import { parseAdjustCreditsForm } from "@/features/owner-users/server/owner-user-schema";
import {
  adjustUserCredits,
  promoteUserToAdmin,
  setUserBlocked
} from "@/features/owner-users/server/owner-user-service";

export async function adjustUserCreditsAction(formData: FormData) {
  await requireAdminUser();
  const input = parseAdjustCreditsForm(formData);
  await adjustUserCredits(input.userId, input.amount, input.reason);
  revalidatePath("/owner/users");
}

export async function setUserBlockedAction(formData: FormData) {
  await requireAdminUser();
  const userId = requireUserId(formData);
  await setUserBlocked(userId, formData.get("blocked") === "1");
  revalidatePath("/owner/users");
}

export async function promoteUserToAdminAction(formData: FormData) {
  const current = await requireAdminUser();
  const userId = requireUserId(formData);
  if (userId === current.id) throw new Error("Cannot change your own role");
  await promoteUserToAdmin(userId);
  revalidatePath("/owner/users");
}

function requireUserId(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("User id is required");
  return userId;
}
