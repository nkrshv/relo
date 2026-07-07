import { ImageResponse } from "next/og";
import { DESTINATIONS, type Destination } from "@/lib/countries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Country comparison on Reloka";

function canonicalPairs(): { a: Destination; b: Destination }[] {
  const pairs: { a: Destination; b: Destination }[] = [];
  for (let i = 0; i < DESTINATIONS.length; i++) {
    for (let j = i + 1; j < DESTINATIONS.length; j++) {
      pairs.push({ a: DESTINATIONS[i], b: DESTINATIONS[j] });
    }
  }
  return pairs;
}

export function generateStaticParams(): { pair: string }[] {
  return canonicalPairs().map((p) => ({ pair: `${p.a.slug}-vs-${p.b.slug}` }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const found = canonicalPairs().find(
    (p) => `${p.a.slug}-vs-${p.b.slug}` === pair,
  );
  const a = found?.a ?? { name: "Country A", emoji: "🌍" };
  const b = found?.b ?? { name: "Country B", emoji: "🌍" };
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
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              fontSize: 72,
              fontWeight: 700,
              color: "#1c1917",
              letterSpacing: "-0.02em",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 64 }}>{a.emoji}</div>
              <div>{a.name}</div>
            </div>
            <div style={{ color: "#a8a29e", fontSize: 48, fontWeight: 500 }}>
              vs
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 64 }}>{b.emoji}</div>
              <div>{b.name}</div>
            </div>
          </div>
          <div style={{ fontSize: 32, color: "#57534e" }}>
            Cost, climate, taxes and safety, compared side by side
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
            Live data with sources
          </div>
        </div>
      </div>
    ),
    size,
  );
}
