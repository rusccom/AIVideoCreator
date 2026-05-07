type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const className = `badge status-${status.toLowerCase()}`;

  return <span className={className}>{status}</span>;
}
