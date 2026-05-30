import { OperationsJobsPanel, OperationsLedgerPanel } from "@/application/admin/client";
import { getOperationsOverview } from "@/application/admin/server";
import { OwnerPageHeader } from "@/application/owner/client";

export const dynamic = "force-dynamic";

export default async function OwnerOperationsPage() {
  const overview = await getOperationsOverview();
  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Operations"
        description="Monitor the generation queue, failures, refunds, and disputes."
      />
      <div className="settings-grid">
        <OperationsJobsPanel failedJobs={overview.failedJobs} jobCounts={overview.jobCounts} />
        <OperationsLedgerPanel pendingPayments={overview.pendingPayments} refunds={overview.refunds} />
      </div>
    </main>
  );
}
