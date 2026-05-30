import { getCreditsPerUsd } from "@/shared/server/service-settings";

export async function getBillingConfig() {
  return { creditsPerUsd: await getCreditsPerUsd() };
}

export function calculateCredits(amountCents: number, creditsPerUsd: number) {
  return Math.round((amountCents * creditsPerUsd) / 100);
}
