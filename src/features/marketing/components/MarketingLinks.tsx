import Link from "next/link";

export function MarketingLinks() {
  return (
    <nav className="marketing-links" aria-label="Main navigation">
      <a href="#workflow">Workflow</a>
      <a href="#use-cases">Use cases</a>
      <a href="#pricing">Pricing</a>
      <Link href="/login">Login</Link>
      <Link className="button button-primary" href="/register">Start creating</Link>
    </nav>
  );
}
