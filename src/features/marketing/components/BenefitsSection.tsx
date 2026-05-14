import { benefits } from "../data/marketing-content";
import { BenefitCard } from "./BenefitCard";

export function BenefitsSection() {
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">Core advantages</span>
        <h2 className="section-title">Designed for continuity, not random clips</h2>
        <div className="grid feature-grid">
          {benefits.map((benefit) => <BenefitCard benefit={benefit} key={benefit} />)}
        </div>
      </div>
    </section>
  );
}
