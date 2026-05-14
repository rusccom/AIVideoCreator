import type { PaymentStatus } from "@prisma/client";
import type { PaymentHistoryItem } from "../server/billing-payment-service";

type PaymentHistoryTableProps = {
  payments: PaymentHistoryItem[];
};

export function PaymentHistoryTable({ payments }: PaymentHistoryTableProps) {
  if (!payments.length) return <p className="form-note">No payments yet.</p>;
  return <div className="billing-table-wrap"><table className="billing-table">{paymentHead()}<tbody>{payments.map(paymentRow)}</tbody></table></div>;
}

function paymentHead() {
  return (
    <thead><tr><th>Date</th><th>Amount</th><th>Credits</th><th>Status</th></tr></thead>
  );
}

function paymentRow(payment: PaymentHistoryItem) {
  return <tr key={payment.id}><td>{formatDate(payment.createdAt)}</td><td>{formatUsd(payment.amountCents)}</td><td>{payment.credits.toLocaleString()}</td><td>{statusLabel(payment.status)}</td></tr>;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatUsd(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}

function statusLabel(status: PaymentStatus) {
  return status.toLowerCase();
}
