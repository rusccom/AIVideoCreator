import { OwnerBillingSummary } from "@/features/billing/components/OwnerBillingSummary";
import { getOwnerBillingOverview } from "@/features/billing/server/billing-owner-service";
import { OwnerPageHeader } from "@/features/owner/components/OwnerPageHeader";

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
