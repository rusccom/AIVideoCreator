import { NextResponse } from "next/server";
import { getStripe } from "@/application/billing/server";
import { handleStripeEvent } from "@/application/billing/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 400 });
  }
  const event = constructStripeEvent(body, signature, secret);
  if (!event) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }
  const result = await handleStripeEvent(event);
  return NextResponse.json({ received: true, result });
}

function constructStripeEvent(body: string, signature: string, secret: string) {
  try {
    return getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return null;
  }
}
