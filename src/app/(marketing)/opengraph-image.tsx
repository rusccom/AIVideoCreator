import { ImageResponse } from "next/og";
import { brand } from "@/shared/brand";

export const runtime = "edge";
export const alt = brand.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(<div style={cardStyle}>{brandRow()}{headlineBlock()}{footerRow()}</div>, { ...size });
}

function brandRow() {
  return <div style={rowStyle}><div style={logoStyle} /><div style={brandStyle}>{brand.name}</div></div>;
}

function headlineBlock() {
  return <div style={headlineWrapStyle}><div style={eyebrowStyle}>Scene-first AI video studio</div><div style={headlineStyle}>Build connected AI scenes from one idea.</div></div>;
}

function footerRow() {
  return <div style={footerStyle}><span>Idea -&gt; Scene map -&gt; Scenes -&gt; Export</span><span style={mutedStyle}>{brand.domain}</span></div>;
}

const cardStyle = { width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", color: "#f6f8ed", fontFamily: "Inter, system-ui, sans-serif", background: "linear-gradient(135deg, rgba(215,255,69,0.32), transparent 40%), linear-gradient(225deg, rgba(56,213,255,0.26), transparent 42%), linear-gradient(180deg, #05080d 0%, #0a1318 54%, #05080d 100%)" } as const;
const rowStyle = { display: "flex", alignItems: "center", gap: 18 } as const;
const logoStyle = { width: 56, height: 56, borderRadius: 12, background: "linear-gradient(135deg, #d7ff45, #38d5ff 58%, #ff6b4a)" } as const;
const brandStyle = { fontSize: 30, fontWeight: 800 } as const;
const headlineWrapStyle = { display: "flex", flexDirection: "column", gap: 24 } as const;
const eyebrowStyle = { color: "#d7ff45", fontSize: 22, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" } as const;
const headlineStyle = { fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: 0, maxWidth: 1000 } as const;
const footerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", color: "#c7d6dc", fontSize: 24 } as const;
const mutedStyle = { color: "#8ca3aa" } as const;
