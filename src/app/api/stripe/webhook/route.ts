import { NextResponse } from "next/server";
import { handleStripeEvent } from "@/features/billing/server/billing-service";
import { getStripe } from "@/features/billing/server/stripe-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 400 });
  }
  const event = getStripe().webhooks.constructEvent(body, signature, secret);
  const result = await handleStripeEvent(event);
  return NextResponse.json({ received: true, result });
}
