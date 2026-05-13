import { BillingBalance } from "@/features/billing/components/BillingBalance";
import { PaymentHistoryTable } from "@/features/billing/components/PaymentHistoryTable";
import { TopUpGrid } from "@/features/billing/components/TopUpGrid";
import { getBillingOverview } from "@/features/billing/server/billing-payment-service";
import { requireCurrentUser } from "@/features/auth/server/current-user";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireCurrentUser();
  const billing = await getBillingOverview(user.id);
  return (
    <>
      <div className="studio-page-header">
        <div>
          <h1>Billing</h1>
          <p>Buy credits and review payment history.</p>
        </div>
      </div>
      <div className="billing-page-grid">
        <BillingBalance balance={billing.balance} />
        <TopUpGrid options={billing.options} />
        <section className="settings-panel">
          <h2>Payment history</h2>
          <PaymentHistoryTable payments={billing.payments} />
        </section>
      </div>
    </>
  );
}
