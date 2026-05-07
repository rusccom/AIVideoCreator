import type { AdminMetric } from "../server/admin-service";
import type { EditableAiModel } from "@/features/owner/types";

type AdminDashboardProps = {
  metrics: AdminMetric[];
  models: EditableAiModel[];
};

export function AdminDashboard({ metrics, models }: AdminDashboardProps) {
  return (
    <main className="studio-content">
      <div className="studio-page-header">
        <div>
          <h1>Service admin</h1>
          <p>Operational view for generations, costs, billing, credits, and models.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="settings-panel">
          <h2>Operations</h2>
          {metrics.map((metric) => (
            <div className="metric-row" key={metric.label}>
              <span>{metric.label}</span>
              <span className="metric-value">{metric.value}</span>
            </div>
          ))}
        </section>
        <section className="settings-panel">
          <h2>Model registry</h2>
          {models.map((model) => (
            <div className="metric-row" key={model.id}>
              <span>{model.displayName}</span>
              <span className="badge">{model.active ? "active" : "disabled"}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
