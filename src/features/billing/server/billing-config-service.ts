const DEFAULT_CREDITS_PER_USD = 100;

export async function getBillingConfig() {
  return { creditsPerUsd: creditsPerUsd() };
}

export function calculateCredits(amountCents: number, creditsPerUsd: number) {
  return Math.round((amountCents * creditsPerUsd) / 100);
}

function creditsPerUsd() {
  const value = Number(process.env.CREDITS_PER_USD ?? DEFAULT_CREDITS_PER_USD);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : DEFAULT_CREDITS_PER_USD;
}
