import Link from "next/link";
import type { MarketingPlan } from "../data/pricing-plans";

type PricingCardProps = {
  plan: MarketingPlan;
};

export function PricingCard({ plan }: PricingCardProps) {
  const className = plan.featured ? "pricing-card featured" : "pricing-card";

  return (
    <article className={className}>
      <span className="badge">{plan.credits}</span>
      <h3>{plan.name}</h3>
      <div className="price">{plan.price}</div>
      <Link className="button button-secondary" href="/register">
        Choose plan
      </Link>
      <ul>
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </article>
  );
}
