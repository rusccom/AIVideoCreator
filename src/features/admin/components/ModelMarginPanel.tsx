import type { ModelMarginRow } from "../server/model-margin-service";

type ModelMarginPanelProps = {
  creditsPerUsd: number;
  rows: ModelMarginRow[];
};

export function ModelMarginPanel({ creditsPerUsd, rows }: ModelMarginPanelProps) {
  return (
    <section className="settings-panel">
      <h2>Model margins</h2>
      {rows.length === 0 ? <p className="form-note">No generations yet.</p> : marginTable(rows, creditsPerUsd)}
    </section>
  );
}

function marginTable(rows: ModelMarginRow[], creditsPerUsd: number) {
  return (
    <div className="billing-table-wrap">
      <table className="billing-table">
        <thead><tr><th>Model</th><th>Runs</th><th>Revenue</th><th>Cost</th><th>Margin</th></tr></thead>
        <tbody>{rows.map((row) => marginRow(row, creditsPerUsd))}</tbody>
      </table>
    </div>
  );
}

function marginRow(row: ModelMarginRow, creditsPerUsd: number) {
  const revenueUsd = creditsPerUsd > 0 ? row.revenueCredits / creditsPerUsd : 0;
  return (
    <tr key={row.modelId}>
      <td>{row.displayName}</td>
      <td>{row.requests.toLocaleString()}</td>
      <td>${revenueUsd.toFixed(2)}</td>
      <td>${row.providerCostUsd.toFixed(2)}</td>
      <td>{marginLabel(revenueUsd, row.providerCostUsd)}</td>
    </tr>
  );
}

function marginLabel(revenueUsd: number, costUsd: number) {
  if (revenueUsd <= 0) return "—";
  return `${Math.round(((revenueUsd - costUsd) / revenueUsd) * 100)}%`;
}
