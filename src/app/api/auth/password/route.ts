import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { changeUserPassword } from "@/features/auth/server/auth-service";
import { passwordChangeSchema } from "@/features/settings/server/password-change-schema";
import { parseJson, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const parsed = await parseJson(request, passwordChangeSchema);
    if (parsed.response) return parsed.response;
    await changeUserPassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      userId: user.id
    });
    return NextResponse.json({ ok: true });
  } catch {
    return unauthorized();
  }
}
