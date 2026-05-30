import { prisma } from "@/shared/server/prisma";
import { getWelcomeCredits } from "@/shared/server/service-settings";
import type { LoginInput, RegisterInput } from "./auth-schema";
import { hashPassword, verifyPassword } from "./password";
import type { SessionUser } from "./session";

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  userId: string;
};

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("Email already exists");
  const passwordHash = await hashPassword(input.password);
  const welcomeCredits = await getWelcomeCredits();
  return prisma.user.create({ data: registerData(input, passwordHash, welcomeCredits) });
}

function registerData(input: RegisterInput, passwordHash: string, welcomeCredits: number) {
  const base = { email: input.email, name: input.name, passwordHash };
  if (welcomeCredits <= 0) return base;
  return { ...base, creditBalance: welcomeCredits, ledgerEntries: { create: welcomeLedger(welcomeCredits) } };
}

function welcomeLedger(amount: number) {
  return { amount, type: "grant", reason: "welcome credits" };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user?.passwordHash) {
    throw new Error("Invalid credentials");
  }
  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }
  if (user.disabledAt) {
    throw new Error("Account is disabled");
  }
  return user;
}

export async function changeUserPassword(input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user?.passwordHash) {
    throw new Error("Invalid credentials");
  }
  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: input.userId }, data: { passwordHash } });
}

export function toSessionUser(user: {
  id: string;
  email: string;
  role: string;
  name?: string | null;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };
}
