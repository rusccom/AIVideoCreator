import { processSteps } from "../data/marketing-content";

export function ProcessSection() {
  return (
    <section className="section" id="workflow">
      <div className="container">
        <span className="eyebrow">How it works</span>
        <h2 className="section-title">From idea to finished video in 4 steps</h2>
        <div className="grid process-grid">
          {processSteps.map((step, index) => (
            <article className="feature-card" key={step.title}>
              <div className="process-number">{index + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
