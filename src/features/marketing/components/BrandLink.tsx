import Link from "next/link";

export function BrandLink() {
  return (
    <Link className="brand-mark" href="/">
      <span className="brand-symbol" />
      <span>AI Sequential Video Studio</span>
    </Link>
  );
}
