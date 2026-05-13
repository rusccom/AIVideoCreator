type BillingBalanceProps = {
  balance: number;
};

export function BillingBalance({ balance }: BillingBalanceProps) {
  return (
    <section className="billing-balance">
      <span>Balance</span>
      <strong>{balance.toLocaleString()} credits</strong>
    </section>
  );
}
