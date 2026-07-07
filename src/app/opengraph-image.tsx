import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Reloka: your personalized relocation checklist";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#fafaf9",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              backgroundColor: "#1c1917",
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 600, color: "#1c1917" }}>
            Reloka
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#1c1917",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Move abroad without the 3am panic research
          </div>
          <div style={{ fontSize: 32, color: "#57534e" }}>
            A step-by-step relocation checklist, personalized to your move
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "2px solid #e7e5e4",
            paddingTop: 28,
          }}
        >
          <div style={{ fontSize: 26, color: "#78716c" }}>reloka.to</div>
          <div style={{ fontSize: 26, color: "#78716c" }}>
            Visa · Housing · Banking · Healthcare · Taxes
          </div>
        </div>
      </div>
    ),
    size,
  );
}
