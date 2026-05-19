import Link from "next/link";
import { Play } from "lucide-react";
import { ContinuityMockup } from "./ContinuityMockup";

export function HeroSection() {
  return <section className="hero"><div className="container hero-grid">{heroCopy()}<ContinuityMockup /></div></section>;
}

function heroCopy() {
  return <div><span className="eyebrow">Sequential AI video</span><h1>AI video production studio for connected scenes</h1><p className="hero-copy">Create source frames, generate short AI video clips, continue from real end frames, and export the timeline as one production-ready MP4.</p>{heroActions()}</div>;
}

function heroActions() {
  return <div className="button-row hero-actions"><Link className="button button-primary" href="/register">Start creating</Link><a className="button button-secondary" href="#workflow"><Play size={17} /> See how it works</a></div>;
}
