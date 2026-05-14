type ReasoningStatProps = {
  label: string;
  value: string;
};

export function ReasoningStat({ label, value }: ReasoningStatProps) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
}
