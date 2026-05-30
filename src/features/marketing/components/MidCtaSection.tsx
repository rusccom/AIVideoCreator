import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function MidCtaSection() {
  return (
    <section className="section compact-section">
      <div className="container">
        <div className="cta-band">
          <div>
            <h2>Your next video can start with one sentence</h2>
            <p>Describe your idea, choose the goal, and let MySceneAI build the first scene-led version of your video.</p>
            <span>Try: "Create a 60-second product ad for a ready maternity hospital bag."</span>
          </div>
          <Link className="button button-primary" href="/register">Start creating now<ArrowRight size={17} /></Link>
        </div>
      </div>
    </section>
  );
}
