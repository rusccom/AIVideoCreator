import { useCases } from "../data/marketing-content";
import { UseCaseCard } from "./UseCaseCard";

export function UseCasesSection() {
  return (
    <section className="section" id="use-cases">
      <div className="container">
        <span className="eyebrow">Scenarios</span>
        <h2 className="section-title">Use-case storyboards, not a flat gallery</h2>
        <div className="grid use-case-grid">
          {useCases.map((useCase) => (
            <UseCaseCard key={useCase} title={useCase} />
          ))}
        </div>
      </div>
    </section>
  );
}
