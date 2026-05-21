import { problemBenefits } from "../data/marketing-content";
import { BenefitCard } from "./BenefitCard";

export function ProblemSection() {
  return (
    <section className="section section-muted">
      <div className="container">
        <span className="eyebrow">The short-clip problem</span>
        <h2 className="section-title">AI clips are short. Your ideas are not.</h2>
        <p className="section-copy">Most AI video tools are great for quick clips, but a real ad, story or channel episode needs more than one isolated shot. AI Video Director helps you continue the video scene by scene, so your content can grow into a longer, connected result.</p>
        <div className="grid three-card-grid">
          {problemBenefits.map((benefit) => <BenefitCard benefit={benefit} key={benefit.title} />)}
        </div>
      </div>
    </section>
  );
}
