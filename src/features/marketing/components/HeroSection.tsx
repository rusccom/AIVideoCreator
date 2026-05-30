import Link from "next/link";
import { Play, WandSparkles } from "lucide-react";
import { brand } from "@/shared/brand";
import { ContinuityMockup } from "./ContinuityMockup";
import { heroTags } from "../data/marketing-content";

export function HeroSection() {
  return <section className="hero"><div className="container hero-grid">{heroCopy()}<ContinuityMockup /></div></section>;
}

function heroCopy() {
  return (
    <div>
      <span className="eyebrow">{brand.tagline}</span>
      <h1>{brand.name}</h1>
      <p className="hero-copy">Plan, generate and extend connected AI video scenes from one idea. MySceneAI turns rough concepts into scene maps, consistent first frames, continued clips and complete exports for ads, channels and social campaigns.</p>
      {heroActions()}
      {heroTagline()}
    </div>
  );
}

function heroActions() {
  return <div className="button-row hero-actions"><Link className="button button-primary" href="/register"><WandSparkles size={17} />Start a scene project</Link><a className="button button-secondary" href="#examples"><Play size={17} />Watch examples</a></div>;
}

function heroTagline() {
  return <div className="hero-tags">{heroTags.map((tag) => <span key={tag}>{tag}</span>)}</div>;
}
