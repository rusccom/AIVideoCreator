import { ArrowRight, Link2 } from "lucide-react";

export function ContinuityMockup() {
  return (
    <div className="continuity-mockup" aria-label="Continuity editor preview">
      {mockTopbar()}
      {mockStage()}
      {mockTimeline()}
    </div>
  );
}

function mockTopbar() {
  return <div className="mockup-topbar"><span>Project: Connected scene</span><span>24s timeline</span></div>;
}

function mockStage() {
  return <div className="mockup-stage">{mockCard("mock-shot", "Start frame", "Scene 01 input")}<ArrowRight className="mock-link" size={24} />{videoCard()}<ArrowRight className="mock-link" size={24} />{endCard()}</div>;
}

function mockCard(shotClass: string, label: string, sub: string) {
  return <div className="mock-card"><div className={shotClass} /><div className="mock-meta"><div className="mock-label">{label}</div><div className="mock-sub">{sub}</div></div></div>;
}

function videoCard() {
  return <div className="mock-card"><div className="mock-shot video"><span className="play-pulse" /></div><div className="mock-meta"><div className="mock-label">6-second clip</div><div className="mock-sub">Grok Imagine - Generating motion</div></div></div>;
}

function endCard() {
  return <div className="mock-card"><div className="mock-shot alt" /><div className="mock-meta"><div className="mock-label">End frame</div><div className="mock-sub"><Link2 size={12} /> Linked to Scene 02</div></div></div>;
}

function mockTimeline() {
  return <div className="mock-timeline">{["Scene 01", "Scene 02", "Scene 03", "Scene 04"].map((scene) => <div className="mock-timeline-item" key={scene}><strong>{scene}</strong><div className="mock-progress" /></div>)}</div>;
}
