import Link from "next/link";
import { brand } from "@/shared/brand";

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="container marketing-footer-inner">
        <span>{brand.name}</span>
        <div className="button-row">
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
          <a href={`mailto:${brand.email}`}>Contact</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
