import { PaymentStatus, Prisma, type Payment } from "@prisma/client";
import type Stripe from "stripe";
import { incrementUserCredits } from "@/shared/server/counters";
import { prisma } from "@/shared/server/prisma";
import { topUpPackages, type TopUpPackage } from "../data/top-up-packages";
import { calculateCredits, getBillingSettings } from "./billing-settings-service";

export type BillingTopUpOption = TopUpPackage & {
  credits: number;
};

export type PaymentHistoryItem = {
  id: string;
  amountCents: number;
  currency: string;
  credits: number;
  status: PaymentStatus;
  createdAt: Date;
  paidAt: Date | null;
};

export async function getBillingOverview(userId: string) {
  const [settings, balance, payments] = await Promise.all([
    getBillingSettings(),
    getCreditBalance(userId),
    listPaymentHistory(userId)
  ]);
  return { balance, payments, options: topUpOptions(settings.creditsPerUsd) };
}

export async function createPendingPayment(
  userId: string,
  item: TopUpPackage,
  creditsPerUsd: number
) {
  return prisma.payment.create({
    data: paymentCreateData(userId, item, creditsPerUsd)
  });
}

export function attachCheckoutSession(paymentId: string, sessionId: string) {
  return prisma.payment.update({
    where: { id: paymentId },
    data: { stripeCheckoutSessionId: sessionId }
  });
}

export async function completeCheckoutSession(
  session: Stripe.Checkout.Session,
  eventId: string
) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId || session.payment_status !== "paid") return { ignored: true };
  return prisma.$transaction((tx) => completePayment(tx, paymentId, session, eventId));
}

export function markSessionCanceled(session: Stripe.Checkout.Session) {
  return markSessionStatus(session, PaymentStatus.CANCELED);
}

export function markSessionFailed(session: Stripe.Checkout.Session) {
  return markSessionStatus(session, PaymentStatus.FAILED);
}

async function completePayment(
  tx: Prisma.TransactionClient,
  paymentId: string,
  session: Stripe.Checkout.Session,
  eventId: string
) {
  const payment = await tx.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === PaymentStatus.PAID) return { ignored: true };
  await tx.payment.update({ where: { id: paymentId }, data: paidData(session) });
  await tx.creditLedger.create({ data: ledgerData(payment, eventId) });
  await incrementUserCredits(tx, payment.userId, payment.credits);
  return { paid: true };
}

async function getCreditBalance(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { creditBalance: true } });
  return user?.creditBalance ?? 0;
}

function listPaymentHistory(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: historySelect()
  });
}

function topUpOptions(creditsPerUsd: number) {
  return topUpPackages.map((item) => ({
    ...item,
    credits: calculateCredits(item.amountCents, creditsPerUsd)
  }));
}

function paymentCreateData(
  userId: string,
  item: TopUpPackage,
  creditsPerUsd: number
) {
  return {
    userId,
    packageKey: item.key,
    amountCents: item.amountCents,
    currency: item.currency,
    credits: calculateCredits(item.amountCents, creditsPerUsd)
  };
}

function paidData(session: Stripe.Checkout.Session) {
  return {
    status: PaymentStatus.PAID,
    paidAt: new Date(),
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId(session)
  };
}

function ledgerData(payment: Payment, eventId: string) {
  return {
    userId: payment.userId,
    amount: payment.credits,
    type: "purchase",
    reason: paymentReason(payment),
    stripeEventId: eventId
  };
}

function paymentReason(payment: { amountCents: number; currency: string }) {
  return `${formatMoney(payment.amountCents, payment.currency)} credit top-up`;
}

function markSessionStatus(session: Stripe.Checkout.Session, status: PaymentStatus) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return { ignored: true };
  return prisma.payment.updateMany({
    where: { id: paymentId, status: PaymentStatus.PENDING },
    data: { status }
  });
}

function paymentIntentId(session: Stripe.Checkout.Session) {
  const intent = session.payment_intent;
  return typeof intent === "string" ? intent : intent?.id ?? null;
}

function formatMoney(amountCents: number, currency: string) {
  return `${currency.toUpperCase()} ${(amountCents / 100).toFixed(2)}`;
}

function historySelect() {
  return {
    id: true,
    amountCents: true,
    currency: true,
    credits: true,
    status: true,
    createdAt: true,
    paidAt: true
  } satisfies Prisma.PaymentSelect;
}
