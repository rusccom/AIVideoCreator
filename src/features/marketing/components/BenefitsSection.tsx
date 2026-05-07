import { benefits } from "../data/marketing-content";

export function BenefitsSection() {
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">Core advantages</span>
        <h2 className="section-title">Designed for continuity, not random clips</h2>
        <div className="grid feature-grid">
          {benefits.map((benefit) => (
            <article className="feature-card" key={benefit}>
              <h3>{benefit}</h3>
              <p>
                Keep prompts, frames, videos, statuses, and exports connected
                inside one project history.
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
