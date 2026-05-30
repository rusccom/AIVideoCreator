import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { getBillingConfig } from "./billing-config-service";
import {
  listActiveTopUpPackages,
  packageCredits,
  type TopUpPackageWriteInput
} from "./top-up-package-service";

export type BillingTopUpOption = {
  key: string;
  label: string;
  credits: number;
  popular: boolean;
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

type PendingPackage = Pick<TopUpPackageWriteInput, "key" | "amountCents" | "bonusCredits"> & {
  currency: string;
};

export async function getBillingOverview(userId: string) {
  const [config, balance, payments, packages] = await Promise.all([
    getBillingConfig(),
    getCreditBalance(userId),
    listPaymentHistory(userId),
    listActiveTopUpPackages()
  ]);
  return { balance, payments, options: topUpOptions(packages, config.creditsPerUsd) };
}

export function createPendingPayment(
  userId: string,
  item: PendingPackage,
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

function topUpOptions(packages: TopUpRecord[], creditsPerUsd: number): BillingTopUpOption[] {
  return packages.map((item) => ({
    key: item.key,
    label: item.label,
    popular: item.popular,
    credits: packageCredits(item, creditsPerUsd)
  }));
}

function paymentCreateData(
  userId: string,
  item: PendingPackage,
  creditsPerUsd: number
) {
  return {
    userId,
    packageKey: item.key,
    amountCents: item.amountCents,
    currency: item.currency,
    credits: packageCredits(item, creditsPerUsd)
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

type TopUpRecord = Awaited<ReturnType<typeof listActiveTopUpPackages>>[number];
