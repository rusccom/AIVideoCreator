import { continuityItems } from "../data/marketing-content";
import { BenefitCard } from "./BenefitCard";

export function ConnectedVideosSection() {
  return (
    <section className="section section-muted" id="continuity">
      <div className="container">
        <span className="eyebrow">Visual continuity</span>
        <h2 className="section-title">Longer videos without visible transitions</h2>
        <p className="section-copy">MySceneAI helps you continue a video naturally from one scene to the next. Instead of collecting random AI clips or hiding cuts with editing tricks, you build a connected timeline where the final export feels like one continuous video.</p>
        <div className="grid four-card-grid">
          {continuityItems.map((item) => <BenefitCard benefit={item} key={item.title} />)}
        </div>
        <p className="section-note">Behind the scenes, the system uses visual continuity so each new scene can follow the previous one without an obvious join.</p>
      </div>
    </section>
  );
}
