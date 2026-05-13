import type { OwnerBillingMetric } from "../server/billing-owner-service";

type OwnerBillingSummaryProps = {
  metrics: OwnerBillingMetric[];
};

export function OwnerBillingSummary({ metrics }: OwnerBillingSummaryProps) {
  return (
    <section className="settings-panel">
      <h2>Billing summary</h2>
      {metrics.map((metric) => (
        <div className="metric-row" key={metric.label}>
          <span>{metric.label}</span>
          <span className="metric-value">{metric.value}</span>
        </div>
      ))}
    </section>
  );
}
