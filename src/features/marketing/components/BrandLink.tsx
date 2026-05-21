import Link from "next/link";

export function BrandLink() {
  return (
    <Link className="brand-mark" href="/">
      <span className="brand-symbol" />
      <span>AI Video Director</span>
    </Link>
  );
}
