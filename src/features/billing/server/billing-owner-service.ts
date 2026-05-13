import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { getBillingSettings } from "./billing-settings-service";

export type OwnerBillingMetric = {
  label: string;
  value: string;
};

export async function getOwnerBillingOverview() {
  const [settings, totals] = await Promise.all([
    getBillingSettings(),
    getPaymentTotals()
  ]);
  return { settings, metrics: ownerBillingMetrics(settings.creditsPerUsd, totals) };
}

async function getPaymentTotals() {
  const [paid, pending, revenue] = await prisma.$transaction([
    prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
    prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.PAID },
      _sum: { amountCents: true, credits: true }
    })
  ]);
  return { paid, pending, revenue };
}

function ownerBillingMetrics(creditsPerUsd: number, totals: PaymentTotals) {
  return [
    { label: "Credits per $1", value: `${creditsPerUsd}` },
    { label: "Paid payments", value: `${totals.paid}` },
    { label: "Pending payments", value: `${totals.pending}` },
    { label: "Revenue", value: formatUsd(totalRevenue(totals)) },
    { label: "Credits sold", value: `${totalCredits(totals)}` }
  ] satisfies OwnerBillingMetric[];
}

type PaymentTotals = Awaited<ReturnType<typeof getPaymentTotals>>;

function totalRevenue(totals: PaymentTotals) {
  return totals.revenue._sum.amountCents ?? 0;
}

function totalCredits(totals: PaymentTotals) {
  return totals.revenue._sum.credits ?? 0;
}

function formatUsd(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}
