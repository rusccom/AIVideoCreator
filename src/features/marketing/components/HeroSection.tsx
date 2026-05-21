import Link from "next/link";
import { Play, WandSparkles } from "lucide-react";
import { ContinuityMockup } from "./ContinuityMockup";
import { heroTags } from "../data/marketing-content";

export function HeroSection() {
  return <section className="hero"><div className="container hero-grid">{heroCopy()}<ContinuityMockup /></div></section>;
}

function heroCopy() {
  return (
    <div>
      <span className="eyebrow">AI Video Director</span>
      <h1>Create long AI videos from a single idea</h1>
      <p className="hero-copy">Make ads, product videos, AI news episodes, social content and cinematic stories. Describe your idea once - AI Video Director helps plan the scenes, continue the visual flow and export one complete video without visible transitions.</p>
      {heroActions()}
      {heroTagline()}
    </div>
  );
}

function heroActions() {
  return <div className="button-row hero-actions"><Link className="button button-primary" href="/register"><WandSparkles size={17} />Start creating</Link><a className="button button-secondary" href="#examples"><Play size={17} />Watch examples</a></div>;
}

function heroTagline() {
  return <div className="hero-tags">{heroTags.map((tag) => <span key={tag}>{tag}</span>)}</div>;
}
