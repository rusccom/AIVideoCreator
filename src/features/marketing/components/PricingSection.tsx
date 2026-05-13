import { marketingPlans } from "../data/pricing-plans";
import { PricingCard } from "./PricingCard";

export function PricingSection() {
  return (
    <section className="section" id="pricing">
      <div className="container">
        <span className="eyebrow">Credits-based billing</span>
        <h2 className="section-title">Credit packs for generation work</h2>
        <p className="section-copy">
          Buy a fixed dollar amount, receive credits by the active account rate,
          and spend them across generation workflows.
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
