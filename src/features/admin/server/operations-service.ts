import { JobStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";

export type JobStatusCount = { status: string; count: number };
export type FailedJobRow = { id: string; modelId: string; message: string; createdAt: Date };
export type RefundRow = { id: string; type: string; amount: number; reason: string; createdAt: Date };

export type OperationsOverview = {
  jobCounts: JobStatusCount[];
  failedJobs: FailedJobRow[];
  refunds: RefundRow[];
  pendingPayments: number;
};

export async function getOperationsOverview(): Promise<OperationsOverview> {
  const [grouped, failedJobs, refunds, pendingPayments] = await Promise.all([
    prisma.generationJob.groupBy({ by: ["status"], _count: { _all: true } }),
    recentFailedJobs(),
    recentRefunds(),
    prisma.payment.count({ where: { status: PaymentStatus.PENDING } })
  ]);
  return { jobCounts: grouped.map(toStatusCount), failedJobs: failedJobs.map(toFailedRow), refunds, pendingPayments };
}

function recentFailedJobs() {
  return prisma.generationJob.findMany({
    where: { status: JobStatus.FAILED },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, modelId: true, createdAt: true, error: { select: { message: true } } }
  });
}

function recentRefunds(): Promise<RefundRow[]> {
  return prisma.creditLedger.findMany({
    where: { type: { in: ["refund", "dispute"] } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, type: true, amount: true, reason: true, createdAt: true }
  });
}

function toStatusCount(row: { status: JobStatus; _count: { _all: number } }): JobStatusCount {
  return { status: row.status, count: row._count._all };
}

function toFailedRow(row: FailedJobSelection): FailedJobRow {
  return { id: row.id, modelId: row.modelId, message: row.error?.message ?? "Unknown error", createdAt: row.createdAt };
}

type FailedJobSelection = {
  id: string;
  modelId: string;
  createdAt: Date;
  error: { message: string } | null;
};
