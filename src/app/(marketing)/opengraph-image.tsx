import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Sequential Video Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          color: "#f4ede4",
          fontFamily: "Inter, system-ui, sans-serif",
          background:
            "radial-gradient(circle at 15% 0%, rgba(255,138,60,0.42), transparent 40%), radial-gradient(circle at 85% 12%, rgba(20,184,166,0.32), transparent 36%), linear-gradient(180deg, #060c10 0%, #0a141a 50%, #060c10 100%)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background:
                "linear-gradient(135deg, #ff8a3c, #14b8a6)"
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 800 }}>
            AI Sequential Video Studio
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              color: "#ff8a3c",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase"
            }}
          >
            Sequential AI video
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -2,
              maxWidth: 1000
            }}
          >
            Long AI scenes from linked 10-second clips.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#c8d4d8",
            fontSize: 24
          }}
        >
          <span>Start frame → 10s clip → end frame → next scene</span>
          <span style={{ color: "#8a9ca3" }}>aivideocreator.app</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
