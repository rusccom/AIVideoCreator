import { ArrowRight, Clapperboard, Lightbulb, Sparkles } from "lucide-react";
import { brand } from "@/shared/brand";
import { directorOutputs } from "../data/marketing-content";

export function ContinuityMockup() {
  return (
    <div className="continuity-mockup" aria-label="MySceneAI workflow preview">
      {mockTopbar()}
      {mockFlow()}
      {promptPanel()}
      {directorPanel()}
    </div>
  );
}

function mockTopbar() {
  return <div className="mockup-topbar"><span>{brand.name}</span><span>Connected scene project</span></div>;
}

function mockFlow() {
  const items = ["Idea", "Scene map", "Scenes", "Export"];
  return <div className="mockup-flow">{items.map((item, index) => flowItem(item, index))}</div>;
}

function flowItem(item: string, index: number) {
  return <div className="flow-step" key={item}><span>{item}</span>{index < 3 ? <ArrowRight size={17} /> : null}</div>;
}

function promptPanel() {
  return <div className="director-prompt"><Lightbulb size={18} /><div><strong>Prompt:</strong><p>"Create a cinematic ad for a maternity hospital bag"</p></div></div>;
}

function directorPanel() {
  return <div className="director-output"><div className="director-output-title"><Clapperboard size={18} />Scene Director creates:</div><div className="director-chips">{directorOutputs.map((item) => <span key={item}><Sparkles size={13} />{item}</span>)}</div></div>;
}
