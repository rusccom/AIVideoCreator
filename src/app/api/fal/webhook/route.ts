import { NextResponse } from "next/server";
import { handleFalWebhook } from "@/features/generation/server/fal-webhook-service";
import { verifyFalWebhook } from "@/features/generation/server/fal-webhook-verifier";

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
