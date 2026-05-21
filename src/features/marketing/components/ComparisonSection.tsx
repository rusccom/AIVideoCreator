import { comparisonRows } from "../data/marketing-content";

export function ComparisonSection() {
  return (
    <section className="section" id="comparison">
      <div className="container">
        <span className="eyebrow">Comparison</span>
        <h2 className="section-title">Short AI clip vs. AI Video Director</h2>
        <div className="comparison-table">
          {comparisonHeader()}
          {comparisonRows.map((row) => (
            <div className="comparison-row" key={row.basic}>
              <span>{row.basic}</span>
              <strong>{row.director}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function comparisonHeader() {
  return <div className="comparison-row comparison-head"><span>Ordinary AI video generator</span><strong>AI Video Director</strong></div>;
}
