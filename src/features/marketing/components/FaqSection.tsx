import { faqs } from "../data/marketing-content";

export function FaqSection() {
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">FAQ</span>
        <h2 className="section-title">Questions before the first timeline</h2>
        <div className="grid faq-grid">
          {faqs.map((faq) => (
            <article className="faq-card" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
