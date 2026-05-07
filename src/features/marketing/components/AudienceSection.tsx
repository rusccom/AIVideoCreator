import { audiences } from "../data/marketing-content";

export function AudienceSection() {
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">Built for</span>
        <h2 className="section-title">Creators, brands, and content teams</h2>
        <p className="section-copy">
          Plan concepts, generate storyboard shots, extend scenes, and export a
          single video for short-form campaigns or production previews.
        </p>
        <div className="audience-list">
          {audiences.map((item) => (
            <span className="audience-pill" key={item}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
