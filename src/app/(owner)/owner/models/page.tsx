import { AdminMetricsPanel, ModelMarginPanel } from "@/application/admin/client";
import { getAdminMetrics, getModelMarginReport, listAiModels } from "@/application/admin/server";
import { OwnerPageHeader, OwnerSectionLink } from "@/application/owner/client";
import { countRegisteredUsers } from "@/application/owner-users/server";
import { listReasoningModels } from "@/application/reasoning/server";
import { getServiceSettings } from "@/application/settings/server";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const data = await loadDashboard();
  return (
    <main className="studio-content">
      <OwnerPageHeader title="Dashboard" description="Operational overview for generations, costs, billing, and models." />
      <div className="settings-grid">
        <AdminMetricsPanel metrics={data.metrics} />
        <ModelMarginPanel creditsPerUsd={data.creditsPerUsd} rows={data.margins} />
      </div>
      <div className="side-stack">{sections(data)}</div>
    </main>
  );
}

async function loadDashboard() {
  const [metrics, margins, models, reasoning, registeredUsers, settings] = await Promise.all([
    getAdminMetrics(),
    getModelMarginReport(),
    listAiModels(),
    listReasoningModels(),
    countRegisteredUsers(),
    getServiceSettings()
  ]);
  return { metrics, margins, creditsPerUsd: settings.creditsPerUsd, models, reasoningCount: reasoning.length, registeredUsers };
}

function sections(data: Awaited<ReturnType<typeof loadDashboard>>) {
  return (
    <section className="settings-panel">
      <h2>Sections</h2>
      <OwnerSectionLink href="/owner/video-models" label="Video generation models" value={`${videoCount(data.models)}`} />
      <OwnerSectionLink href="/owner/image-models" label="Image generation models" value={`${imageCount(data.models)}`} />
      <OwnerSectionLink href="/owner/intelligence-models" label="Intelligence models" value={`${data.reasoningCount}`} />
      <OwnerSectionLink href="/owner/billing" label="Billing settings" value="rate" />
      <OwnerSectionLink href="/owner/operations" label="Operations" value="jobs" />
      <OwnerSectionLink href="/owner/users" label="Registered users" value={`${data.registeredUsers}`} />
    </section>
  );
}

type ModelList = Awaited<ReturnType<typeof listAiModels>>;

function videoCount(models: ModelList) {
  return models.filter((model) => model.type === "image-to-video").length;
}

function imageCount(models: ModelList) {
  return models.filter((model) => model.type !== "image-to-video").length;
}
