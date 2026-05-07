import Link from "next/link";

type OwnerSectionLinkProps = {
  href: string;
  label: string;
  value: string;
};

export function OwnerSectionLink({ href, label, value }: OwnerSectionLinkProps) {
  return (
    <Link className="metric-row" href={href}>
      <span>{label}</span>
      <span className="metric-value">{value}</span>
    </Link>
  );
}
