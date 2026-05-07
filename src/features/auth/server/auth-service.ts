import { prisma } from "@/shared/server/prisma";
import type { LoginInput, RegisterInput } from "./auth-schema";
import { hashPassword, verifyPassword } from "./password";
import type { SessionUser } from "./session";

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("Email already exists");
  }
  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      subscriptions: {
        create: {
          planKey: "starter",
          status: "trialing",
          monthlyCreditLimit: 100,
          creditsBalance: 100
        }
      },
      ledgerEntries: {
        create: {
          amount: 100,
          type: "grant",
          reason: "trial credits"
        }
      }
    }
  });
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
  return user;
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
