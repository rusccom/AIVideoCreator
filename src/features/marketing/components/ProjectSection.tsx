import { projectFeatures } from "../data/marketing-content";
import { BenefitCard } from "./BenefitCard";

export function ProjectSection() {
  return (
    <section className="section section-muted">
      <div className="container">
        <span className="eyebrow">One project</span>
        <h2 className="section-title">Everything in one video project</h2>
        <p className="section-copy">Keep your ideas, scenes, generated clips, images and exports together. Create, continue, improve and export without losing the structure of your video.</p>
        <div className="grid four-card-grid">
          {projectFeatures.map((feature) => <BenefitCard benefit={feature} key={feature.title} />)}
        </div>
      </div>
    </section>
  );
}
