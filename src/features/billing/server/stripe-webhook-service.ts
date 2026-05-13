import type Stripe from "stripe";
import { prisma } from "@/shared/server/prisma";
import {
  completeCheckoutSession,
  markSessionCanceled,
  markSessionFailed
} from "./billing-payment-service";

export async function handleStripeEvent(event: Stripe.Event) {
  const created = await createWebhookEvent(event);
  if (!created) return { duplicate: true };
  if (event.type === "checkout.session.completed") {
    return completeCheckoutSession(checkoutSession(event), event.id);
  }
  if (event.type === "checkout.session.expired") {
    return markSessionCanceled(checkoutSession(event));
  }
  if (event.type === "checkout.session.async_payment_failed") {
    return markSessionFailed(checkoutSession(event));
  }
  return { ignored: true };
}

async function createWebhookEvent(event: Stripe.Event) {
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "stripe", eventId: event.id } }
  });
  if (existing) return false;
  await prisma.webhookEvent.create({
    data: { provider: "stripe", eventId: event.id, payloadJson: event as object }
  });
  return true;
}

function checkoutSession(event: Stripe.Event) {
  return event.data.object as Stripe.Checkout.Session;
}
