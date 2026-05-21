import { audienceCards } from "../data/marketing-content";
import { BenefitCard } from "./BenefitCard";

export function AudienceSection() {
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">Built for</span>
        <h2 className="section-title">Built for creators, brands and small teams</h2>
        <p className="section-copy">Create video concepts without a film crew, editor or complex production pipeline.</p>
        <div className="grid audience-card-grid">
          {audienceCards.map((audience) => <BenefitCard benefit={audience} key={audience.title} />)}
        </div>
      </div>
    </section>
  );
}
