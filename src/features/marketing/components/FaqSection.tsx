import { faqs } from "../data/marketing-content";

export function FaqSection() {
  return (
    <section className="section section-muted" id="faq">
      <div className="container">
        <span className="eyebrow">FAQ</span>
        <h2 className="section-title">Questions before your first video</h2>
        <div className="grid faq-grid">
          {faqs.map((faq) => (
            <article className="faq-card" key={faq.title}>
              <h3>{faq.title}</h3>
              <p>{faq.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
