import { NextResponse } from "next/server";
import { loginSchema } from "@/application/auth/server";
import { loginUser, toSessionUser } from "@/application/auth/server";
import { setSessionCookie, signSession } from "@/application/auth/server";
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
