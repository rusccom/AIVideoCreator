import type { AdminMetric } from "../server/admin-service";

type AdminMetricsPanelProps = {
  metrics: AdminMetric[];
  title?: string;
};

export function AdminMetricsPanel({ metrics, title }: AdminMetricsPanelProps) {
  return (
    <section className="settings-panel">
      <h2>{title ?? "Operations"}</h2>
      {metrics.map((metric) => (
        <div className="metric-row" key={metric.label}>
          <span>{metric.label}</span>
          <span className="metric-value">{metric.value}</span>
        </div>
      ))}
    </section>
  );
}
