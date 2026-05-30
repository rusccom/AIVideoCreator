import Link from "next/link";
import { WandSparkles } from "lucide-react";
import { brand } from "@/shared/brand";

export function FinalCtaSection() {
  return (
    <section className="section final-cta-section">
      <div className="container final-cta">
        <span className="eyebrow">{brand.name}</span>
        <h2>Ready to create a complete video from one idea?</h2>
        <p>Make ads, social clips, AI news episodes, product videos and story-driven content inside one connected project.</p>
        <Link className="button button-primary" href="/register"><WandSparkles size={17} />Start a scene project</Link>
      </div>
    </section>
  );
}
