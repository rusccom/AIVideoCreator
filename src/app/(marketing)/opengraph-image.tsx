import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Sequential Video Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(<div style={cardStyle}>{brandRow()}{headlineBlock()}{footerRow()}</div>, { ...size });
}

function brandRow() {
  return <div style={rowStyle}><div style={logoStyle} /><div style={brandStyle}>AI Sequential Video Studio</div></div>;
}

function headlineBlock() {
  return <div style={headlineWrapStyle}><div style={eyebrowStyle}>Sequential AI video</div><div style={headlineStyle}>Long AI scenes from linked 10-second clips.</div></div>;
}

function footerRow() {
  return <div style={footerStyle}><span>Start frame -&gt; 10s clip -&gt; end frame -&gt; next scene</span><span style={mutedStyle}>aivideocreator.app</span></div>;
}

const cardStyle = { width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", color: "#f4ede4", fontFamily: "Inter, system-ui, sans-serif", background: "radial-gradient(circle at 15% 0%, rgba(255,138,60,0.42), transparent 40%), radial-gradient(circle at 85% 12%, rgba(20,184,166,0.32), transparent 36%), linear-gradient(180deg, #060c10 0%, #0a141a 50%, #060c10 100%)" } as const;
const rowStyle = { display: "flex", alignItems: "center", gap: 18 } as const;
const logoStyle = { width: 56, height: 56, borderRadius: 12, background: "linear-gradient(135deg, #ff8a3c, #14b8a6)" } as const;
const brandStyle = { fontSize: 30, fontWeight: 800 } as const;
const headlineWrapStyle = { display: "flex", flexDirection: "column", gap: 24 } as const;
const eyebrowStyle = { color: "#ff8a3c", fontSize: 22, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" } as const;
const headlineStyle = { fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, maxWidth: 1000 } as const;
const footerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", color: "#c8d4d8", fontSize: 24 } as const;
const mutedStyle = { color: "#8a9ca3" } as const;
