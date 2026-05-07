import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="container marketing-footer-inner">
        <span>AI Sequential Video Studio</span>
        <div className="button-row">
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
          <a href="mailto:contact@aivideocreator.app">Contact</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
