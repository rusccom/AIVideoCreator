import { UserRole } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";

export type OwnerUserRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  creditBalance: number;
};

export function countRegisteredUsers() {
  return prisma.user.count({ where: { role: UserRole.USER } });
}

export async function getOwnerUsersOverview() {
  const users = await prisma.user.findMany({
    where: { role: UserRole.USER },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, createdAt: true }
  });
  return { totalUsers: users.length, users: await attachBalances(users) };
}

async function attachBalances(users: Omit<OwnerUserRow, "creditBalance">[]) {
  if (!users.length) return [];
  const balances = await balanceMap(users.map((user) => user.id));
  return users.map((user) => ({
    ...user,
    creditBalance: balances.get(user.id) ?? 0
  }));
}

async function balanceMap(userIds: string[]) {
  const rows = await prisma.creditLedger.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds } },
    _sum: { amount: true }
  });
  return new Map(rows.map((row) => [row.userId, row._sum.amount ?? 0]));
}
