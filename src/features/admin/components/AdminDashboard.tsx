import type { AdminMetric } from "../server/admin-service";
import type { EditableAiModel } from "@/shared/model-form";

type AdminDashboardProps = {
  metrics: AdminMetric[];
  models: EditableAiModel[];
};

export function AdminDashboard({ metrics, models }: AdminDashboardProps) {
  return <main className="studio-content">{adminHeader()}<div className="settings-grid">{metricsPanel(metrics)}{modelsPanel(models)}</div></main>;
}

function adminHeader() {
  return <div className="studio-page-header"><div><h1>Service admin</h1><p>Operational view for generations, costs, billing, credits, and models.</p></div></div>;
}

function metricsPanel(metrics: AdminMetric[]) {
  return <section className="settings-panel"><h2>Operations</h2>{metrics.map((metric) => <div className="metric-row" key={metric.label}><span>{metric.label}</span><span className="metric-value">{metric.value}</span></div>)}</section>;
}

function modelsPanel(models: EditableAiModel[]) {
  return <section className="settings-panel"><h2>Model registry</h2>{models.map((model) => <div className="metric-row" key={model.id}><span>{model.displayName}</span><span className="badge">{model.active ? "active" : "disabled"}</span></div>)}</section>;
}
