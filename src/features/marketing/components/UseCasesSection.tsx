import { useCases } from "../data/marketing-content";
import { UseCaseCard } from "./UseCaseCard";

export function UseCasesSection() {
  return (
    <section className="section" id="examples">
      <div className="container">
        <span className="eyebrow">Prompt ideas</span>
        <h2 className="section-title">Start with an idea. Get a video concept.</h2>
        <div className="grid use-case-grid">
          {useCases.map((useCase) => (
            <UseCaseCard key={useCase.title} useCase={useCase} />
          ))}
        </div>
      </div>
    </section>
  );
}
