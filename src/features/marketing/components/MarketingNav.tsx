import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="marketing-nav">
      <div className="container marketing-nav-inner">
        <Link className="brand-mark" href="/">
          <span className="brand-symbol" />
          <span>AI Sequential Video Studio</span>
        </Link>
        <nav className="marketing-links" aria-label="Main navigation">
          <a href="#workflow">Workflow</a>
          <a href="#use-cases">Use cases</a>
          <a href="#pricing">Pricing</a>
          <Link href="/login">Login</Link>
          <Link className="button button-primary" href="/register">
            Start creating
          </Link>
        </nav>
      </div>
    </header>
  );
}
