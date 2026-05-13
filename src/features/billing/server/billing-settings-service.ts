import { prisma } from "@/shared/server/prisma";

const SETTINGS_ID = "global";
const DEFAULT_CREDITS_PER_USD = 100;

export async function getBillingSettings() {
  return prisma.billingSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: billingSettingsDefaults()
  });
}

export async function updateBillingSettings(creditsPerUsd: number) {
  return prisma.billingSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { creditsPerUsd },
    create: { ...billingSettingsDefaults(), creditsPerUsd }
  });
}

export function calculateCredits(amountCents: number, creditsPerUsd: number) {
  return Math.round((amountCents * creditsPerUsd) / 100);
}

function billingSettingsDefaults() {
  return { id: SETTINGS_ID, creditsPerUsd: DEFAULT_CREDITS_PER_USD };
}
