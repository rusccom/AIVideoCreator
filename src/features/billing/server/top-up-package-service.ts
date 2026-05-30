import { prisma } from "@/shared/server/prisma";
import { calculateCredits } from "./billing-config-service";

export type TopUpPackageWriteInput = {
  key: string;
  label: string;
  amountCents: number;
  bonusCredits: number;
  popular: boolean;
  active: boolean;
  sortOrder: number;
};

type PackageCreditSource = {
  amountCents: number;
  bonusCredits: number;
};

export function listActiveTopUpPackages() {
  return prisma.topUpPackage.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { amountCents: "asc" }]
  });
}

export function listAllTopUpPackages() {
  return prisma.topUpPackage.findMany({
    orderBy: [{ sortOrder: "asc" }, { amountCents: "asc" }]
  });
}

export function getActiveTopUpPackage(key: string) {
  return prisma.topUpPackage.findFirst({ where: { key, active: true } });
}

export function packageCredits(pkg: PackageCreditSource, creditsPerUsd: number) {
  return calculateCredits(pkg.amountCents, creditsPerUsd) + pkg.bonusCredits;
}

export function createTopUpPackage(input: TopUpPackageWriteInput) {
  return prisma.topUpPackage.create({ data: { ...input, currency: "usd" } });
}

export function updateTopUpPackage(id: string, input: TopUpPackageWriteInput) {
  return prisma.topUpPackage.update({ where: { id }, data: input });
}

export function deleteTopUpPackage(id: string) {
  return prisma.topUpPackage.delete({ where: { id } });
}
