"use client";

import {
  monthName,
  pollutant,
  type ClimateTwin,
  type ClimatePoint,
} from "@/lib/climateTwin";

export const COMFORT_COPY: Record<string, string> = {
  similar: "Similar climate",
  milder: "Milder overall",
  harsher: "Harsher overall",
  mixed: "A real change",
};

interface CompareCell {
  key: string;
  label: string;
  home: string;
  dest: string;
  hint?: string;
}

function buildCells(
  home: ClimatePoint,
  dest: ClimatePoint,
  aqi?: { home: number | null; dest: number | null },
): CompareCell[] {
  const cells: CompareCell[] = [];
  // Each city keeps its own month, so cross-hemisphere pairs read correctly
  // (Utrecht's coldest month is January, Sydney's is June).
  const temp = (c: number, m: number | null) =>
    `${c}°${m ? ` in ${monthName(m).slice(0, 3)}` : ""}`;

  // Live air-quality index sits with the climate comparison so home and
  // destination read side by side (moved out of the Health tab).
  if (aqi && aqi.home != null && aqi.dest != null)
    cells.push({
      key: "aqi",
      label: "Air quality",
      home: `AQI ${aqi.home}`,
      dest: `AQI ${aqi.dest}`,
      hint: "Live air quality index from the nearest WAQI station (lower is cleaner)",
    });

  if (home.coldestC !== null && dest.coldestC !== null)
    cells.push({
      key: "coldest",
      label: "Coldest month",
      home: temp(home.coldestC, home.coldestMonth),
      dest: temp(dest.coldestC, dest.coldestMonth),
      hint: "Mean daily temperature of each city's own coldest month",
    });
  if (home.warmestC !== null && dest.warmestC !== null)
    cells.push({
      key: "warmest",
      label: "Warmest month",
      home: temp(home.warmestC, home.warmestMonth),
      dest: temp(dest.warmestC, dest.warmestMonth),
      hint: "Mean daily temperature of each city's own warmest month",
    });
  if (home.sunnyDays !== null && dest.sunnyDays !== null)
    cells.push({
      key: "sunny",
      label: "Sunny days",
      home: `${home.sunnyDays} / yr`,
      dest: `${dest.sunnyDays} / yr`,
      hint: "Days with more than 4.5 hours of sunshine over the year",
    });
  if (home.annualPrecipMm !== null && dest.annualPrecipMm !== null)
    cells.push({
      key: "rain",
      label: "Rain a year",
      home: `${home.annualPrecipMm} mm`,
      dest: `${dest.annualPrecipMm} mm`,
    });
  if (home.humidityPct !== null && dest.humidityPct !== null)
    cells.push({
      key: "humidity",
      label: "Humidity",
      home: `${home.humidityPct}%`,
      dest: `${dest.humidityPct}%`,
      hint: "Mean daily relative humidity",
    });

  // Air pollutants: annual averages, shown only where both cities measure the
  // pollutant in the same unit (providers report NO2/CO/SO2 in µg/m³ or ppb).
  for (const d of dest.air) {
    const h = pollutant(home, d.parameter);
    if (!h || h.unit !== d.unit) continue;
    cells.push({
      key: d.parameter,
      label: `${d.label} a year`,
      home: `${h.value} ${h.unit}`,
      dest: `${d.value} ${d.unit}`,
      hint: `Annual average from the nearest OpenAQ sensors`,
    });
  }
  return cells;
}

/**
 * Climate twin detail rendered inside the Country snapshot tabs: the same
 * bento-tile language as the rest of the snapshot, with home and destination
 * stacked inside each tile so the comparison reads at a glance.
 */
export default function ClimateTwinPanel({
  twin,
  aqi,
}: {
  twin: ClimateTwin;
  aqi?: { home: number | null; dest: number | null };
}) {
  const { home, dest, aiSummary, verdicts, sources } = twin;
  const cells = buildCells(home, dest, aqi);

  return (
    <div className="mt-2.5 space-y-2.5">
      {aiSummary ? (
        <p className="text-sm leading-relaxed text-stone-700">{aiSummary}</p>
      ) : (
        verdicts.length > 0 && (
          <ul className="space-y-1.5">
            {verdicts.map((v, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed text-stone-700"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300"
                  aria-hidden
                />
                <span>{v}</span>
              </li>
            ))}
          </ul>
        )
      )}

      {cells.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {cells.map((c) => (
            <div
              key={c.key}
              title={c.hint}
              className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2.5"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                {c.label}
              </p>
              <div className="mt-1.5 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] text-stone-400">
                    {home.label}
                  </span>
                  <span className="tnum shrink-0 text-sm text-stone-500">
                    {c.home}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] text-stone-500">
                    {dest.label}
                  </span>
                  <span className="tnum shrink-0 text-sm font-semibold text-stone-900">
                    {c.dest}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-stone-400">
        {home.label} versus {dest.label}, historical normals from{" "}
        {dest.year ?? home.year}. Sources:{" "}
        {[...sources, aqi && aqi.home != null && aqi.dest != null ? "WAQI" : null]
          .filter(Boolean)
          .join(", ")}
        .
      </p>
    </div>
  );
}
