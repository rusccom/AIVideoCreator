import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = connectionLimitedUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function connectionLimitedUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) return undefined;
  const url = new URL(value);
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", process.env.PRISMA_CONNECTION_LIMIT ?? "10");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", process.env.PRISMA_POOL_TIMEOUT ?? "20");
  }
  return url.toString();
}
