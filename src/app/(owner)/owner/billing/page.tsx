import { OwnerBillingSettingsForm } from "@/features/billing/components/OwnerBillingSettingsForm";
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
        description="Set the credit rate and monitor top-up payments."
      />
      <div className="settings-grid">
        <section className="settings-panel">
          <h2>Credit rate</h2>
          <OwnerBillingSettingsForm
            creditsPerUsd={overview.settings.creditsPerUsd}
          />
        </section>
        <OwnerBillingSummary metrics={overview.metrics} />
      </div>
    </main>
  );
}
