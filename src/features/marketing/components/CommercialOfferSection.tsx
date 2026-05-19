import { commercialOffer } from "../data/marketing-content";

export function CommercialOfferSection() {
  return (
    <section className="section offer-section" id="offer">
      <div className="container offer-grid">
        {offerIntro()}
        {offerScope()}
      </div>
    </section>
  );
}

function offerIntro() {
  return (
    <div>
      <span className="eyebrow">Commercial offer</span>
      <h2 className="section-title">{commercialOffer.title}</h2>
      <p className="section-copy">{commercialOffer.copy}</p>
      <div className="offer-metrics">
        {commercialOffer.metrics.map((item) => metric(item))}
      </div>
    </div>
  );
}

function offerScope() {
  return (
    <div className="offer-stack">
      {commercialOffer.scope.map((item) => (
        <article className="offer-item" key={item}>
          <span />
          <p>{item}</p>
        </article>
      ))}
    </div>
  );
}

function metric(item: { label: string; value: string }) {
  return (
    <div className="offer-metric" key={item.label}>
      <strong>{item.value}</strong>
      <span>{item.label}</span>
    </div>
  );
}
