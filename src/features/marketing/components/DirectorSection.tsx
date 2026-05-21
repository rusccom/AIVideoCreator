import { directorFeatures } from "../data/marketing-content";
import { BenefitCard } from "./BenefitCard";

export function DirectorSection() {
  return (
    <section className="section section-muted">
      <div className="container">
        <span className="eyebrow">AI Director</span>
        <h2 className="section-title">Not just a prompt box. Your AI video director.</h2>
        <p className="section-copy">You do not need to write perfect cinematic prompts. Start with a rough idea, and AI Video Director helps turn it into a structured video plan with scenes, style, pacing and visual direction.</p>
        <div className="grid four-card-grid">
          {directorFeatures.map((feature) => <BenefitCard benefit={feature} key={feature.title} />)}
        </div>
      </div>
    </section>
  );
}
