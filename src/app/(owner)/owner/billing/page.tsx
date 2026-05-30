import { OwnerBillingSummary, OwnerTopUpPackages } from "@/application/billing/client";
import { getOwnerBillingOverview, listAllTopUpPackages } from "@/application/billing/server";
import {
  createTopUpPackageAction,
  deleteTopUpPackageAction,
  updateTopUpPackageAction
} from "@/application/billing/billing-actions";
import { OwnerPageHeader } from "@/application/owner/client";
import { ServiceSettingsForm } from "@/application/settings/client";
import { getServiceSettings } from "@/application/settings/server";
import { updateServiceSettingsAction } from "@/application/settings/settings-actions";

export const dynamic = "force-dynamic";

export default async function OwnerBillingPage() {
  const [overview, settings, packages] = await Promise.all([
    getOwnerBillingOverview(),
    getServiceSettings(),
    listAllTopUpPackages()
  ]);
  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Billing"
        description="Set the credit rate, welcome credits, and the top-up packages offered at checkout."
      />
      <div className="settings-grid">
        <ServiceSettingsForm action={updateServiceSettingsAction} settings={settings} />
        <OwnerBillingSummary metrics={overview.metrics} />
      </div>
      <OwnerTopUpPackages
        createAction={createTopUpPackageAction}
        creditsPerUsd={settings.creditsPerUsd}
        deleteAction={deleteTopUpPackageAction}
        packages={packages}
        updateAction={updateTopUpPackageAction}
      />
    </main>
  );
}
