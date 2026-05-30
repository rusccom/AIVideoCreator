import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { topUpPackages, type TopUpPackage } from "../data/top-up-packages";
import { calculateCredits, getBillingConfig } from "./billing-config-service";

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
    getBillingConfig(),
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

export async function deletePendingPayment(paymentId: string) {
  await prisma.payment.deleteMany({
    where: { id: paymentId, status: PaymentStatus.PENDING }
  });
}

async function getCreditBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true }
  });
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
