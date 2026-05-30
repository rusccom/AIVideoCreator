import type { RefundRow } from "../server/operations-service";

type OperationsLedgerPanelProps = {
  pendingPayments: number;
  refunds: RefundRow[];
};

export function OperationsLedgerPanel({ pendingPayments, refunds }: OperationsLedgerPanelProps) {
  return (
    <section className="settings-panel">
      <h2>Refunds & disputes</h2>
      <div className="metric-row">
        <span>Pending payments</span>
        <span className="metric-value">{pendingPayments.toLocaleString()}</span>
      </div>
      {refunds.length === 0 ? <p className="form-note">No refunds or disputes.</p> : refundTable(refunds)}
    </section>
  );
}

function refundTable(refunds: RefundRow[]) {
  return (
    <div className="billing-table-wrap">
      <table className="billing-table">
        <thead><tr><th>Type</th><th>Credits</th><th>Reason</th><th>When</th></tr></thead>
        <tbody>{refunds.map(refundRow)}</tbody>
      </table>
    </div>
  );
}

function refundRow(refund: RefundRow) {
  return (
    <tr key={refund.id}>
      <td>{refund.type}</td>
      <td>{refund.amount.toLocaleString()}</td>
      <td>{refund.reason}</td>
      <td>{formatDate(refund.createdAt)}</td>
    </tr>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "short", timeStyle: "short" }).format(date);
}
