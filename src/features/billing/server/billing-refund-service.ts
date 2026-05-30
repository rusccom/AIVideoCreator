import { PaymentStatus, type Payment, type Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { incrementUserCredits } from "@/shared/server/counters";

type Result =
  | { ignored: true; reason: string }
  | { refunded: true; deltaCredits: number };

export async function applyChargeRefund(
  tx: Prisma.TransactionClient,
  charge: Stripe.Charge,
  eventId: string
): Promise<Result> {
  const payment = await findPaymentByIntent(tx, paymentIntentId(charge));
  if (!payment) return { ignored: true, reason: "payment-not-found" };
  const deltaCents = (charge.amount_refunded ?? 0) - payment.refundedCents;
  if (deltaCents <= 0) return { ignored: true, reason: "no-new-refund" };
  const deltaCredits = computeRefundCredits(payment, deltaCents);
  return applyRefundDelta(tx, payment, deltaCents, deltaCredits, eventId, "refund");
}

export async function applyChargeDispute(
  tx: Prisma.TransactionClient,
  dispute: Stripe.Dispute,
  eventId: string
): Promise<Result> {
  const payment = await findPaymentByIntent(tx, paymentIntentId(dispute));
  if (!payment) return { ignored: true, reason: "payment-not-found" };
  const remainingCents = payment.amountCents - payment.refundedCents;
  if (remainingCents <= 0) return { ignored: true, reason: "already-refunded" };
  const remainingCredits = payment.credits - payment.refundedCredits;
  return applyRefundDelta(tx, payment, remainingCents, remainingCredits, eventId, "dispute");
}

async function applyRefundDelta(
  tx: Prisma.TransactionClient,
  payment: Payment,
  deltaCents: number,
  deltaCredits: number,
  eventId: string,
  type: "refund" | "dispute"
): Promise<Result> {
  await tx.creditLedger.create({ data: refundLedger(payment, deltaCredits, eventId, type) });
  await incrementUserCredits(tx, payment.userId, -deltaCredits);
  await tx.payment.update({
    where: { id: payment.id },
    data: nextRefundState(payment, deltaCents, deltaCredits)
  });
  return { refunded: true, deltaCredits };
}

function findPaymentByIntent(tx: Prisma.TransactionClient, intentId: string | null) {
  if (!intentId) return Promise.resolve(null);
  return tx.payment.findFirst({ where: { stripePaymentIntentId: intentId } });
}

function computeRefundCredits(payment: Payment, deltaCents: number) {
  const remainingCents = payment.amountCents - payment.refundedCents;
  const remainingCredits = payment.credits - payment.refundedCredits;
  if (deltaCents >= remainingCents) return remainingCredits;
  return Math.floor((payment.credits * deltaCents) / payment.amountCents);
}

function refundLedger(
  payment: Payment,
  credits: number,
  eventId: string,
  type: "refund" | "dispute"
) {
  return {
    userId: payment.userId,
    amount: -credits,
    type,
    reason: `${type} of ${formatMoney(payment.amountCents, payment.currency)}`,
    stripeEventId: eventId
  };
}

function nextRefundState(payment: Payment, deltaCents: number, deltaCredits: number) {
  const refundedCents = payment.refundedCents + deltaCents;
  const refundedCredits = payment.refundedCredits + deltaCredits;
  const fullyRefunded = refundedCents >= payment.amountCents;
  return {
    refundedCents,
    refundedCredits,
    status: fullyRefunded ? PaymentStatus.REFUNDED : payment.status
  };
}

function paymentIntentId(source: Stripe.Charge | Stripe.Dispute) {
  const value = source.payment_intent;
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function formatMoney(amountCents: number, currency: string) {
  return `${currency.toUpperCase()} ${(amountCents / 100).toFixed(2)}`;
}
