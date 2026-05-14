import { NextResponse } from "next/server";
import { handleFalWebhook } from "@/application/generation/server";
import { verifyFalWebhook } from "@/application/generation/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const valid = await verifyFalWebhook(request.headers, body);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const result = await handleFalWebhook(JSON.parse(body));
  return NextResponse.json({ ok: true, result });
}
