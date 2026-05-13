export const topUpPackageKeys = ["usd_10", "usd_20", "usd_50"] as const;

export type TopUpPackageKey = (typeof topUpPackageKeys)[number];

export type TopUpPackage = {
  key: TopUpPackageKey;
  label: string;
  amountCents: number;
  amountUsd: number;
  currency: "usd";
};

export const topUpPackages: TopUpPackage[] = [
  { key: "usd_10", label: "$10", amountCents: 1000, amountUsd: 10, currency: "usd" },
  { key: "usd_20", label: "$20", amountCents: 2000, amountUsd: 20, currency: "usd" },
  { key: "usd_50", label: "$50", amountCents: 5000, amountUsd: 50, currency: "usd" }
];

export function findTopUpPackage(key: TopUpPackageKey) {
  return topUpPackages.find((item) => item.key === key);
}
