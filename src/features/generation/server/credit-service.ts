import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";

export async function getCreditBalance(userId: string) {
  const result = await prisma.creditLedger.aggregate({
    where: { userId },
    _sum: { amount: true }
  });
  return result._sum.amount ?? 0;
}

export async function reserveCredits(
  userId: string,
  amount: number,
  jobId: string,
  reason: string
) {
  try {
    await reserveCreditsTransaction(userId, amount, jobId, reason);
  } catch (error) {
    if (!isTransactionConflict(error)) throw error;
    await reserveCreditsTransaction(userId, amount, jobId, reason);
  }
}

async function reserveCreditsTransaction(
  userId: string,
  amount: number,
  jobId: string,
  reason: string
) {
  await prisma.$transaction(async (tx) => {
    const balance = await creditBalance(tx, userId);
    if (balance < amount) throw new Error("Insufficient credits");
    await tx.generationJob.update({ where: { id: jobId }, data: { creditsReserved: amount } });
    await tx.creditLedger.create({ data: reserveData(userId, amount, jobId, reason) });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function commitCredits(jobId: string) {
  const job = await prisma.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  return prisma.generationJob.update({
    where: { id: jobId },
    data: { creditsSpent: job.creditsReserved }
  });
}

export async function refundCredits(jobId: string, reason: string) {
  try {
    return await createRefund(jobId, reason);
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    return refundLedger(jobId);
  }
}

async function createRefund(jobId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.generationJob.findUniqueOrThrow({ where: { id: jobId } });
    const existing = await tx.creditLedger.findFirst({
      where: { generationJobId: jobId, type: "refund" }
    });
    if (existing || job.creditsReserved <= 0) return existing;
    return tx.creditLedger.create({
      data: refundData(job.userId, job.creditsReserved, jobId, reason)
    });
  });
}

function refundLedger(jobId: string) {
  return prisma.creditLedger.findFirst({ where: { generationJobId: jobId, type: "refund" } });
}

async function creditBalance(tx: Prisma.TransactionClient, userId: string) {
  const result = await tx.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } });
  return result._sum.amount ?? 0;
}

function reserveData(userId: string, amount: number, jobId: string, reason: string) {
  return { userId, amount: -amount, type: "reserve", reason, generationJobId: jobId };
}

function isTransactionConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function refundData(userId: string, amount: number, jobId: string, reason: string) {
  return {
    userId,
    amount,
    type: "refund",
    reason,
    generationJobId: jobId
  };
}
