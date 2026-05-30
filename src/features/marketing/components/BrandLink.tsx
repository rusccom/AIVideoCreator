import Link from "next/link";
import { brand } from "@/shared/brand";

export function BrandLink() {
  return (
    <Link className="brand-mark" href="/">
      <span className="brand-symbol" />
      <span>{brand.name}</span>
    </Link>
  );
}
