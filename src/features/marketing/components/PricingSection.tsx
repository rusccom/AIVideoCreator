import { marketingPlans } from "../data/pricing-plans";
import { PricingCard } from "./PricingCard";

export function PricingSection() {
  return (
    <section className="section" id="pricing">
      <div className="container">
        <span className="eyebrow">Pricing</span>
        <h2 className="section-title">Choose the plan for your video workflow</h2>
        <p className="section-copy">
          Start small, test ideas, then create longer videos when you need more
          scenes, higher quality or more exports.
        </p>
        <div className="grid pricing-grid">
          {marketingPlans.map((plan) => (
            <PricingCard key={plan.key} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
