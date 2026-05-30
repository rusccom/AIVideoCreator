import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/shared/server/prisma";
import {
  completeCheckoutSession,
  markSessionCanceled,
  markSessionFailed
} from "./billing-checkout-completion";
import { applyChargeDispute, applyChargeRefund } from "./billing-refund-service";
import { redactStripeEvent } from "./stripe-event-redactor";

export async function handleStripeEvent(event: Stripe.Event) {
  try {
    return await prisma.$transaction((tx) => processEvent(tx, event));
  } catch (err) {
    if (isDuplicateEventError(err)) return { duplicate: true };
    throw err;
  }
}

async function processEvent(tx: Prisma.TransactionClient, event: Stripe.Event) {
  await tx.webhookEvent.create({
    data: {
      provider: "stripe",
      eventId: event.id,
      payloadJson: redactStripeEvent(event) as Prisma.InputJsonValue
    }
  });
  return dispatch(tx, event);
}

function dispatch(tx: Prisma.TransactionClient, event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    return completeCheckoutSession(tx, sessionData(event), event.id);
  }
  if (event.type === "checkout.session.async_payment_succeeded") {
    return completeCheckoutSession(tx, sessionData(event), event.id);
  }
  if (event.type === "checkout.session.expired") {
    return markSessionCanceled(tx, sessionData(event));
  }
  if (event.type === "checkout.session.async_payment_failed") {
    return markSessionFailed(tx, sessionData(event));
  }
  if (event.type === "charge.refunded") {
    return applyChargeRefund(tx, event.data.object as Stripe.Charge, event.id);
  }
  if (event.type === "charge.dispute.funds_withdrawn") {
    return applyChargeDispute(tx, event.data.object as Stripe.Dispute, event.id);
  }
  return { ignored: true };
}

function isDuplicateEventError(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

function sessionData(event: Stripe.Event) {
  return event.data.object as Stripe.Checkout.Session;
}
