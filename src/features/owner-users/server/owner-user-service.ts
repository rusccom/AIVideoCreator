import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { incrementUserCredits } from "@/shared/server/counters";

export type OwnerUserRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  role: UserRole;
  creditBalance: number;
  spentCredits: number;
  disabled: boolean;
};

type UserSelection = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  role: UserRole;
  creditBalance: number;
  disabledAt: Date | null;
};

export function countRegisteredUsers() {
  return prisma.user.count({ where: { role: UserRole.USER } });
}

export async function getOwnerUsersOverview() {
  const users = await prisma.user.findMany({
    where: { role: UserRole.USER },
    orderBy: { createdAt: "desc" },
    select: userSelect()
  });
  return { totalUsers: users.length, users: await attachSpend(users) };
}

export async function adjustUserCredits(userId: string, delta: number, reason: string) {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { creditBalance: true } });
    if (user.creditBalance + delta < 0) throw new Error("Insufficient balance");
    await incrementUserCredits(tx, userId, delta);
    await tx.creditLedger.create({ data: { userId, amount: delta, type: "adjust", reason } });
  });
}

export function setUserBlocked(userId: string, blocked: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { disabledAt: blocked ? new Date() : null } });
}

export function promoteUserToAdmin(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { role: UserRole.ADMIN } });
}

async function attachSpend(users: UserSelection[]): Promise<OwnerUserRow[]> {
  const spend = await spendMap(users.map((user) => user.id));
  return users.map((user) => toRow(user, spend.get(user.id) ?? 0));
}

function toRow(user: UserSelection, spentCredits: number): OwnerUserRow {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    role: user.role,
    creditBalance: user.creditBalance,
    spentCredits,
    disabled: user.disabledAt !== null
  };
}

async function spendMap(userIds: string[]) {
  if (!userIds.length) return new Map<string, number>();
  const rows = await prisma.generationJob.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds } },
    _sum: { creditsSpent: true }
  });
  return new Map(rows.map((row) => [row.userId, row._sum.creditsSpent ?? 0]));
}

function userSelect() {
  return {
    id: true,
    email: true,
    name: true,
    createdAt: true,
    role: true,
    creditBalance: true,
    disabledAt: true
  } satisfies Prisma.UserSelect;
}
