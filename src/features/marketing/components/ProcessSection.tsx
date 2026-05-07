import { processSteps } from "../data/marketing-content";

export function ProcessSection() {
  return (
    <section className="section" id="workflow">
      <div className="container">
        <span className="eyebrow">Workflow</span>
        <h2 className="section-title">From one frame to a connected timeline</h2>
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
