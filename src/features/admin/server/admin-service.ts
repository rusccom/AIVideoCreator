import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";

export type AdminMetric = {
  label: string;
  value: string;
};

export async function getAdminMetrics() {
  return buildAdminMetrics(await getAdminMetricRows());
}

async function getAdminMetricRows() {
  return prisma.$transaction([
    prisma.user.count(),
    prisma.generationJob.count({ where: { status: "QUEUED" } }),
    prisma.generationJob.count({ where: { status: "FAILED" } }),
    prisma.creditLedger.aggregate({ where: { amount: { gt: 0 } }, _sum: { amount: true } }),
    prisma.asset.aggregate({ _sum: { sizeBytes: true } }),
    prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
    prisma.payment.aggregate({ where: { status: PaymentStatus.PAID }, _sum: { amountCents: true } }),
    prisma.reasoningModel.aggregate({ _sum: { totalTokensUsed: true, estimatedCostUsd: true } })
  ]);
}

function buildAdminMetrics(rows: Awaited<ReturnType<typeof getAdminMetricRows>>) {
  const [users, queuedJobs, failedJobs, credits, storage, paidPayments, revenue, reasoning] = rows;
  return [
    { label: "Users", value: `${users}` },
    { label: "Queued jobs", value: `${queuedJobs}` },
    { label: "Failed jobs", value: `${failedJobs}` },
    { label: "Credits issued", value: `${credits._sum.amount ?? 0}` },
    { label: "Storage", value: formatBytes(storage._sum.sizeBytes ?? 0) },
    { label: "Paid payments", value: `${paidPayments}` },
    { label: "Revenue", value: formatCents(revenue._sum.amountCents ?? 0) },
    { label: "Reasoning tokens", value: `${reasoning._sum.totalTokensUsed ?? 0}` },
    { label: "Reasoning cost", value: formatUsd(reasoning._sum.estimatedCostUsd ?? 0) }
  ] satisfies AdminMetric[];
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatUsd(value: number) {
  return `$${value.toFixed(4)}`;
}

function formatCents(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}
