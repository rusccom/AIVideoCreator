import { prisma } from "./prisma";

const SETTINGS_ID = "global";
const DEFAULT_CREDITS_PER_USD = 100;
const DEFAULT_WELCOME_CREDITS = 100;

export type ServiceSettings = {
  creditsPerUsd: number;
  welcomeCredits: number;
};

export async function getServiceSettings(): Promise<ServiceSettings> {
  const row = await prisma.serviceSettings.findUnique({ where: { id: SETTINGS_ID } });
  return {
    creditsPerUsd: row?.creditsPerUsd ?? DEFAULT_CREDITS_PER_USD,
    welcomeCredits: row?.welcomeCredits ?? DEFAULT_WELCOME_CREDITS
  };
}

export async function getCreditsPerUsd() {
  return (await getServiceSettings()).creditsPerUsd;
}

export async function getWelcomeCredits() {
  return (await getServiceSettings()).welcomeCredits;
}

export function updateServiceSettings(input: ServiceSettings) {
  return prisma.serviceSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...input },
    update: input
  });
}
