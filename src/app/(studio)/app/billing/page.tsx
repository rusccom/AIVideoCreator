import { plans } from "@/features/billing/data/plans";
import { PricingCard } from "@/features/marketing/components/PricingCard";

export default function BillingPage() {
  return (
    <>
      <div className="studio-page-header">
        <div>
          <h1>Billing</h1>
          <p>Manage credits, plan limits, Stripe checkout, and customer portal.</p>
        </div>
      </div>
      <div className="billing-grid">
        {plans.map((plan) => (
          <PricingCard key={plan.key} plan={plan} />
        ))}
      </div>
    </>
  );
}
