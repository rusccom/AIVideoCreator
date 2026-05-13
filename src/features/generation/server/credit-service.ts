import { Prisma } from "@prisma/client";
import { incrementUserCredits } from "@/shared/server/counters";
import { prisma } from "@/shared/server/prisma";

export async function getCreditBalance(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { creditBalance: true } });
  return user?.creditBalance ?? 0;
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
    const reserved = await tx.user.updateMany({
      where: { id: userId, creditBalance: { gte: amount } },
      data: { creditBalance: { decrement: amount } }
    });
    if (reserved.count !== 1) throw new Error("Insufficient credits");
    await tx.generationJob.update({ where: { id: jobId }, data: { creditsReserved: amount } });
    await tx.creditLedger.create({ data: reserveData(userId, amount, jobId, reason) });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}

export async function commitCredits(jobId: string) {
  const job = await prisma.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  return prisma.generationJob.update({
    where: { id: jobId },
    data: { creditsSpent: job.creditsReserved, actualCredits: job.creditsReserved }
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
    const ledger = await tx.creditLedger.create({
      data: refundData(job.userId, job.creditsReserved, jobId, reason)
    });
    await incrementUserCredits(tx, job.userId, job.creditsReserved);
    return ledger;
  });
}

function refundLedger(jobId: string) {
  return prisma.creditLedger.findFirst({ where: { generationJobId: jobId, type: "refund" } });
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
