"use client";

import { useClimateTwin } from "@/lib/useClimateTwin";
import { monthName, pollutant, type ClimatePoint } from "@/lib/climateTwin";

const COMFORT_COPY: Record<string, string> = {
  similar: "Similar climate",
  milder: "Milder overall",
  harsher: "Harsher overall",
  mixed: "A real change",
};

interface StatRow {
  label: string;
  home: string;
  dest: string;
}

function buildRows(home: ClimatePoint, dest: ClimatePoint): StatRow[] {
  const rows: StatRow[] = [];
  const both = (
    a: number | null,
    b: number | null,
    fmt: (n: number) => string,
    label: string,
    sub?: string,
  ) => {
    if (a !== null && b !== null)
      rows.push({ label: sub ? `${label} (${sub})` : label, home: fmt(a), dest: fmt(b) });
  };
  const mm = (n: number) => `${n} mm`;
  const pct = (n: number) => `${n}%`;
  // Each city keeps its own month, so cross-hemisphere pairs read correctly
  // (Utrecht's coldest month is January, Sydney's is June).
  const temp = (c: number, m: number | null) =>
    `${c}°${m ? ` (${monthName(m).slice(0, 3)})` : ""}`;

  if (home.coldestC !== null && dest.coldestC !== null) {
    rows.push({
      label: "Coldest month",
      home: temp(home.coldestC, home.coldestMonth),
      dest: temp(dest.coldestC, dest.coldestMonth),
    });
  }
  if (home.warmestC !== null && dest.warmestC !== null) {
    rows.push({
      label: "Warmest month",
      home: temp(home.warmestC, home.warmestMonth),
      dest: temp(dest.warmestC, dest.warmestMonth),
    });
  }
  both(home.annualPrecipMm, dest.annualPrecipMm, mm, "Rain a year");
  both(home.humidityPct, dest.humidityPct, pct, "Humidity");

  // Air pollutants: annual averages, shown only where both cities measure the
  // pollutant in the same unit (providers report NO2/CO/SO2 in µg/m³ or ppb).
  for (const d of dest.air) {
    const h = pollutant(home, d.parameter);
    if (!h || h.unit !== d.unit) continue;
    rows.push({
      label: `${d.label} a year`,
      home: `${h.value} ${h.unit}`,
      dest: `${d.value} ${d.unit}`,
    });
  }
  return rows;
}

export default function ClimateTwin({
  fromCountry,
  toCountry,
  fromCity,
  toCity,
}: {
  fromCountry: string;
  toCountry: string;
  fromCity?: string;
  toCity?: string;
}) {
  const twin = useClimateTwin(fromCountry, toCountry, fromCity, toCity);
  if (!twin || twin.verdicts.length === 0) return null;

  const { home, dest, comfort, verdicts, packing, aiSummary, sources } = twin;
  const rows = buildRows(home, dest);

  return (
    <section className="reveal mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-stone-400"
            aria-hidden
          >
            <path d="M10 2v2m0 12v2m8-8h-2M4 10H2m13.66-5.66-1.42 1.42M5.76 14.24l-1.42 1.42m11.32 0-1.42-1.42M5.76 5.76 4.34 4.34" />
            <circle cx="10" cy="10" r="3.2" />
          </svg>
          <h3 className="text-sm font-semibold text-stone-900">Climate twin</h3>
        </div>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-stone-600">
          {COMFORT_COPY[comfort] ?? "Compared to home"}
        </span>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <p className="text-xs text-stone-500">
          {home.label} versus {dest.label}
        </p>

        {aiSummary && (
          <p className="mt-3 text-sm leading-relaxed text-stone-800">
            {aiSummary}
          </p>
        )}

        <ul className="mt-3 space-y-2">
          {verdicts.map((v, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-stone-700">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" aria-hidden />
              <span>{v}</span>
            </li>
          ))}
        </ul>

        {rows.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-md border border-stone-100">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 bg-stone-50 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-stone-400">
              <span />
              <span className="text-right">{home.label}</span>
              <span className="text-right">{dest.label}</span>
            </div>
            {rows.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-t border-stone-100 px-3 py-1.5 text-sm"
              >
                <span className="text-stone-600">{r.label}</span>
                <span className="text-right tabular-nums text-stone-500">{r.home}</span>
                <span className="text-right font-medium tabular-nums text-stone-900">
                  {r.dest}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            What to pack
          </p>
          <ul className="mt-2 space-y-1.5">
            {packing.map((p, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed text-stone-700"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400"
                  aria-hidden
                >
                  <path d="M3.5 8.5l3 3 6-7" />
                </svg>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-[11px] text-stone-400">
          Historical normals from {dest.year ?? home.year}. Sources:{" "}
          {sources.join(", ")}.
        </p>
      </div>
    </section>
  );
}
