import { NextResponse } from "next/server";
import { loginSchema } from "@/features/auth/server/auth-schema";
import { loginUser, toSessionUser } from "@/features/auth/server/auth-service";
import { setSessionCookie, signSession } from "@/features/auth/server/session";
import { parseJson } from "@/shared/server/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = await parseJson(request, loginSchema);
  if (parsed.response) return parsed.response;
  const user = await loginUser(parsed.data);
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const response = NextResponse.json({ id: user.id });
  setSessionCookie(response, await signSession(toSessionUser(user)));
  return response;
}
