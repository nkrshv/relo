"use client";

import { useEffect, useState } from "react";
import type { ClimateTwin } from "@/lib/climateTwin";

// Climate and sunny-days rows for the /compare table. The rest of the table
// is static curated data, but climate normals only exist in the curated
// insights snapshot for a subset of countries, so non-curated destinations
// (e.g. Armenia) would otherwise show "—". These rows fill from the same live
// Open-Meteo source the plan uses (/api/climate-twin), on demand, whenever a
// side is missing curated climate. Successful curated pages stay static (no
// fetch, no flicker); a failed fetch just falls back to whatever curated
// value existed.

interface Props {
  aName: string;
  bName: string;
  aCapital: string | null;
  bCapital: string | null;
  /** Curated fallbacks, already formatted, or null when not curated. */
  aClimate: string | null;
  bClimate: string | null;
  aSunny: string | null;
  bSunny: string | null;
}

function climateText(
  janC: number | null,
  julC: number | null,
  capital: string | null,
): string | null {
  if (janC == null || julC == null) return null;
  const suffix = capital ? ` · ${capital}` : "";
  return `Jan ${Math.round(janC)}° · Jul ${Math.round(julC)}°${suffix}`;
}

function sunnyText(sunnyDays: number | null): string | null {
  return sunnyDays == null ? null : `${sunnyDays} days / yr`;
}

export default function CompareClimateRows({
  aName,
  bName,
  aCapital,
  bCapital,
  aClimate,
  bClimate,
  aSunny,
  bSunny,
}: Props) {
  const needsLive =
    !aClimate || !bClimate || !aSunny || !bSunny;

  const [live, setLive] = useState<ClimateTwin | null>(null);

  useEffect(() => {
    if (!needsLive) return;

    const params = new URLSearchParams({
      fromCountry: aName,
      toCountry: bName,
    });
    if (aCapital) params.set("fromCity", aCapital);
    if (bCapital) params.set("toCity", bCapital);

    let cancelled = false;
    fetch(`/api/climate-twin?${params.toString()}`)
      .then((res) => (res.ok ? (res.json() as Promise<ClimateTwin>) : null))
      .then((data) => {
        if (!cancelled && data) setLive(data);
      })
      .catch(() => {
        // Leave the curated fallback in place.
      });

    return () => {
      cancelled = true;
    };
  }, [needsLive, aName, bName, aCapital, bCapital]);

  const aClimateOut =
    aClimate ??
    (live ? climateText(live.home.janC, live.home.julC, aCapital) : null);
  const bClimateOut =
    bClimate ??
    (live ? climateText(live.dest.janC, live.dest.julC, bCapital) : null);
  const aSunnyOut = aSunny ?? (live ? sunnyText(live.home.sunnyDays) : null);
  const bSunnyOut = bSunny ?? (live ? sunnyText(live.dest.sunnyDays) : null);

  return (
    <>
      <Row
        label="Climate (capital)"
        source="Open-Meteo historical weather"
        a={aClimateOut}
        b={bClimateOut}
      />
      <Row
        label="Sunny days (capital)"
        source="Open-Meteo, days with over 4.5h of sunshine"
        a={aSunnyOut}
        b={bSunnyOut}
      />
    </>
  );
}

function Row({
  label,
  source,
  a,
  b,
}: {
  label: string;
  source: string;
  a: string | null;
  b: string | null;
}) {
  return (
    <div className="grid grid-cols-[1.2fr_1fr_1fr] items-start border-b border-stone-100 px-4 py-3 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-stone-700">{label}</p>
        <p className="mt-0.5 text-[11px] text-stone-500">{source}</p>
      </div>
      <p className="tnum pr-2 text-sm text-stone-800">{a ?? "—"}</p>
      <p className="tnum text-sm text-stone-800">{b ?? "—"}</p>
    </div>
  );
}
