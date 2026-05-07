import Link from "next/link";
import { Play } from "lucide-react";
import { ContinuityMockup } from "./ContinuityMockup";

export function HeroSection() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <span className="eyebrow">Sequential AI video</span>
          <h1>AI video studio for long scenes made from short generations</h1>
          <p className="hero-copy">
            Create the first frame, generate a 6-second clip, then continue
            from the real end frame. Build longer AI scenes as a linked
            storyboard instead of isolated video attempts.
          </p>
          <div className="button-row hero-actions">
            <Link className="button button-primary" href="/register">
              Start creating
            </Link>
            <a className="button button-secondary" href="#workflow">
              <Play size={17} /> See how it works
            </a>
          </div>
        </div>
        <ContinuityMockup />
      </div>
    </section>
  );
}
