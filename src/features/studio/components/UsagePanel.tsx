type UsagePanelProps = {
  metrics: Array<{
    label: string;
    value: string;
  }>;
};

export function UsagePanel({ metrics }: UsagePanelProps) {
  return (
    <section className="metric-panel">
      <h2>Usage</h2>
      {metrics.map((metric) => (
        <div className="metric-row" key={metric.label}>
          <span>{metric.label}</span>
          <span className="metric-value">{metric.value}</span>
        </div>
      ))}
    </section>
  );
}
