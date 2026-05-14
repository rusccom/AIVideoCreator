import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/application/auth/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
