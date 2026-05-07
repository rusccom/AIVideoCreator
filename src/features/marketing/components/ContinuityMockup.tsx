import { ArrowRight, Link2 } from "lucide-react";

export function ContinuityMockup() {
  return (
    <div className="continuity-mockup" aria-label="Continuity editor preview">
      <div className="mockup-topbar">
        <span>Project: Connected scene</span>
        <span>24s timeline</span>
      </div>
      <div className="mockup-stage">
        <div className="mock-card">
          <div className="mock-shot" />
          <div className="mock-meta">
            <div className="mock-label">Start frame</div>
            <div className="mock-sub">Scene 01 input</div>
          </div>
        </div>
        <ArrowRight className="mock-link" size={24} />
        <div className="mock-card">
          <div className="mock-shot video">
            <span className="play-pulse" />
          </div>
          <div className="mock-meta">
            <div className="mock-label">6-second clip</div>
            <div className="mock-sub">Grok Imagine - Generating motion</div>
          </div>
        </div>
        <ArrowRight className="mock-link" size={24} />
        <div className="mock-card">
          <div className="mock-shot alt" />
          <div className="mock-meta">
            <div className="mock-label">End frame</div>
            <div className="mock-sub">
              <Link2 size={12} /> Linked to Scene 02
            </div>
          </div>
        </div>
      </div>
      <div className="mock-timeline">
        {["Scene 01", "Scene 02", "Scene 03", "Scene 04"].map((scene) => (
          <div className="mock-timeline-item" key={scene}>
            <strong>{scene}</strong>
            <div className="mock-progress" />
          </div>
        ))}
      </div>
    </div>
  );
}
