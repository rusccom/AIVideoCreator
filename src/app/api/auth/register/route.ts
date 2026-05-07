import { NextResponse } from "next/server";
import { registerSchema } from "@/features/auth/server/auth-schema";
import { registerUser, toSessionUser } from "@/features/auth/server/auth-service";
import { setSessionCookie, signSession } from "@/features/auth/server/session";
import { parseJson } from "@/shared/server/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = await parseJson(request, registerSchema);
  if (parsed.response) return parsed.response;
  const user = await registerUser(parsed.data);
  const token = await signSession(toSessionUser(user));
  const response = NextResponse.json({ id: user.id });
  setSessionCookie(response, token);
  return response;
}
