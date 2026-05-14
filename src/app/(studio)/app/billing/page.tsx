import { BillingBalance } from "@/application/billing/client";
import { PaymentHistoryTable } from "@/application/billing/client";
import { TopUpGrid } from "@/application/billing/client";
import { getBillingOverview } from "@/application/billing/server";
import { requireCurrentUser } from "@/application/auth/server";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireCurrentUser();
  const billing = await getBillingOverview(user.id);
  return (
    <>
      {billingHeader()}
      <div className="billing-page-grid">
        <BillingBalance balance={billing.balance} />
        <TopUpGrid options={billing.options} />
        {paymentHistory(billing.payments)}
      </div>
    </>
  );
}

function billingHeader() {
  return <div className="studio-page-header"><div><h1>Billing</h1><p>Buy credits and review payment history.</p></div></div>;
}

function paymentHistory(payments: Awaited<ReturnType<typeof getBillingOverview>>["payments"]) {
  return <section className="settings-panel"><h2>Payment history</h2><PaymentHistoryTable payments={payments} /></section>;
}
