import type { BillingTopUpOption } from "../server/billing-payment-service";
import { TopUpCard } from "./TopUpCard";

type TopUpGridProps = {
  options: BillingTopUpOption[];
};

export function TopUpGrid({ options }: TopUpGridProps) {
  return (
    <section className="billing-top-up-grid">
      {options.map((option) => (
        <TopUpCard key={option.key} option={option} />
      ))}
    </section>
  );
}
