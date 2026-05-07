type LegalPageProps = {
  title: string;
  sections: Array<{
    heading: string;
    text: string;
  }>;
};

export function LegalPage({ title, sections }: LegalPageProps) {
  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Legal</span>
        <h1 className="section-title">{title}</h1>
        <div className="grid feature-grid hero-actions">
          {sections.map((section) => (
            <article className="feature-card" key={section.heading}>
              <h3>{section.heading}</h3>
              <p>{section.text}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
