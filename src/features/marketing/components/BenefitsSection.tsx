import { creationTypes } from "../data/marketing-content";
import { BenefitCard } from "./BenefitCard";

export function BenefitsSection() {
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">What you can create</span>
        <h2 className="section-title">What can you create with AI Video Director?</h2>
        <p className="section-copy">Use it for real content, not just short AI experiments. Build videos for marketing, social media, channels, products and storytelling.</p>
        <div className="grid feature-grid">
          {creationTypes.map((benefit) => <BenefitCard benefit={benefit} key={benefit.title} />)}
        </div>
      </div>
    </section>
  );
}
