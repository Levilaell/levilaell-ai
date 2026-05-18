import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0A",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              background: "#0A0A0A",
              border: "2px solid #1F1F1F",
              borderRadius: 16,
              position: "relative",
              display: "flex",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 33,
                top: 21,
                width: 14,
                height: 54,
                background: "#FFFFFF",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 54,
                top: 60,
                width: 15,
                height: 15,
                background: "#E8742C",
              }}
            />
          </div>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: 44,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {siteConfig.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            {siteConfig.tagline}
          </div>
          <div
            style={{
              color: "#A1A1A1",
              fontSize: 30,
              letterSpacing: "-0.01em",
            }}
          >
            {siteConfig.domain}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
