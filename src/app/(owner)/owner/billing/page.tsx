import { OwnerBillingSummary } from "@/application/billing/client";
import { getOwnerBillingOverview } from "@/application/billing/server";
import { OwnerPageHeader } from "@/application/owner/client";

export const dynamic = "force-dynamic";

export default async function OwnerBillingPage() {
  const overview = await getOwnerBillingOverview();
  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Billing"
        description="Monitor credit top-up payments and configured rates."
      />
      <div className="settings-grid">
        <OwnerBillingSummary metrics={overview.metrics} />
      </div>
    </main>
  );
}
