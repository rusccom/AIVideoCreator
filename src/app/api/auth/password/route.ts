import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { changeUserPassword } from "@/application/auth/server";
import { passwordChangeSchema } from "@/application/settings/server";
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
