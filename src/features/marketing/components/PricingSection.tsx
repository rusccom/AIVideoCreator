import { plans } from "@/features/billing/data/plans";
import { PricingCard } from "./PricingCard";

export function PricingSection() {
  return (
    <section className="section" id="pricing">
      <div className="container">
        <span className="eyebrow">Credits-based billing</span>
        <h2 className="section-title">Plans ready for different model costs</h2>
        <p className="section-copy">
          Credits cover image-to-video generation, premium exports, and storage
          limits without hardcoding one price per clip.
        </p>
        <div className="grid pricing-grid">
          {plans.map((plan) => (
            <PricingCard key={plan.key} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
