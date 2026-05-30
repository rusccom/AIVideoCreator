import { PaymentStatus, type Payment, type Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { incrementUserCredits } from "@/shared/server/counters";

type Result =
  | { paid: true }
  | { ignored: true; reason: string }
  | { count: number };

export async function completeCheckoutSession(
  tx: Prisma.TransactionClient,
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<Result> {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return { ignored: true, reason: "no-payment-id" };
  if (session.payment_status !== "paid") return { ignored: true, reason: "not-paid" };
  const payment = await tx.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ignored: true, reason: "payment-not-found" };
  if (payment.status === PaymentStatus.PAID) return { ignored: true, reason: "already-paid" };
  if (!amountMatches(payment, session)) return { ignored: true, reason: "amount-mismatch" };
  return applyPaidPayment(tx, payment, session, eventId);
}

export function markSessionCanceled(tx: Prisma.TransactionClient, session: Stripe.Checkout.Session) {
  return markSessionStatus(tx, session, PaymentStatus.CANCELED);
}

export function markSessionFailed(tx: Prisma.TransactionClient, session: Stripe.Checkout.Session) {
  return markSessionStatus(tx, session, PaymentStatus.FAILED);
}

async function applyPaidPayment(
  tx: Prisma.TransactionClient,
  payment: Payment,
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<Result> {
  await tx.payment.update({ where: { id: payment.id }, data: paidData(session) });
  await tx.creditLedger.create({ data: purchaseLedger(payment, eventId) });
  await incrementUserCredits(tx, payment.userId, payment.credits);
  return { paid: true };
}

function paidData(session: Stripe.Checkout.Session) {
  return {
    status: PaymentStatus.PAID,
    paidAt: new Date(),
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId(session)
  };
}

function purchaseLedger(payment: Payment, eventId: string) {
  return {
    userId: payment.userId,
    amount: payment.credits,
    type: "purchase",
    reason: paymentReason(payment),
    stripeEventId: eventId
  };
}

function paymentReason(payment: Payment) {
  return `${formatMoney(payment.amountCents, payment.currency)} credit top-up`;
}

async function markSessionStatus(
  tx: Prisma.TransactionClient,
  session: Stripe.Checkout.Session,
  status: PaymentStatus
): Promise<Result> {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return { ignored: true, reason: "no-payment-id" };
  const res = await tx.payment.updateMany({
    where: { id: paymentId, status: PaymentStatus.PENDING },
    data: { status }
  });
  return { count: res.count };
}

function amountMatches(payment: Payment, session: Stripe.Checkout.Session) {
  if (session.amount_total == null) return false;
  if (session.currency && session.currency !== payment.currency) return false;
  return session.amount_total === payment.amountCents;
}

function paymentIntentId(session: Stripe.Checkout.Session) {
  const intent = session.payment_intent;
  return typeof intent === "string" ? intent : intent?.id ?? null;
}

function formatMoney(amountCents: number, currency: string) {
  return `${currency.toUpperCase()} ${(amountCents / 100).toFixed(2)}`;
}
