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

interface AqiSide {
  value: number;
  /** Station / place the reading actually came from (may be a capital when
   *  the chosen city has no nearby station), so it is never mislabelled. */
  place: string;
}

interface CompareCell {
  key: string;
  label: string;
  home: string;
  dest: string;
  /** Per-row overrides for the side labels (used by air quality, whose
   *  reading can come from a different place than the compared city). */
  homeLabel?: string;
  destLabel?: string;
  hint?: string;
  /** Plain-language explanation of the metric, shown behind a small info dot. */
  info?: string;
}

// Plain-language, non-technical descriptions of each air metric, shown in a
// hover/focus popover next to the label so movers know what SO2/O3/etc mean.
const METRIC_INFO: Record<string, string> = {
  aqi: "Air Quality Index: several pollutants combined into one 0-500 score. Under 50 is good, over 150 is unhealthy. Lower is cleaner.",
  pm25: "PM2.5: microscopic particles from traffic, wood smoke and industry that reach deep into the lungs. The main health-relevant pollutant.",
  pm10: "PM10: coarser dust and particles from roads, construction and pollen that irritate the airways.",
  no2: "NO2 (nitrogen dioxide): mostly from car and truck exhaust, so it runs higher near busy roads.",
  o3: "O3 (ground-level ozone): forms in sunlight from traffic fumes, peaks on hot sunny days and irritates breathing.",
  so2: "SO2 (sulphur dioxide): from burning coal or oil and heavy industry; can trigger asthma and irritate the throat.",
  co: "CO (carbon monoxide): from combustion such as traffic and heating; at high levels it lowers the oxygen your blood can carry.",
};

function buildCells(
  home: ClimatePoint,
  dest: ClimatePoint,
  aqi?: { home: AqiSide | null; dest: AqiSide | null },
): CompareCell[] {
  const cells: CompareCell[] = [];
  // Each city keeps its own month, so cross-hemisphere pairs read correctly
  // (Utrecht's coldest month is January, Sydney's is June).
  const temp = (c: number, m: number | null) =>
    `${c}°${m ? ` in ${monthName(m).slice(0, 3)}` : ""}`;

  // Live air-quality index sits with the climate comparison so home and
  // destination read side by side (moved out of the Health tab). Labelled with
  // the compared city (like every other tile) for a consistent read; the
  // actual measuring station is disclosed in the info popover so a
  // capital/nearby-station reading is never silently passed off as the city.
  if (aqi && aqi.home && aqi.dest)
    cells.push({
      key: "aqi",
      label: "Air quality",
      home: `AQI ${aqi.home.value}`,
      dest: `AQI ${aqi.dest.value}`,
      hint: `Live air quality index from the nearest WAQI station (lower is cleaner). Home reading from ${aqi.home.place}; destination from ${aqi.dest.place}.`,
      info: `${METRIC_INFO.aqi} Nearest station: ${aqi.home.place} (home), ${aqi.dest.place} (destination).`,
    });

  if (home.coldestC != null && dest.coldestC != null)
    cells.push({
      key: "coldest",
      label: "Coldest month",
      home: temp(home.coldestC, home.coldestMonth),
      dest: temp(dest.coldestC, dest.coldestMonth),
      hint: "Mean daily temperature of each city's own coldest month",
    });
  if (home.warmestC != null && dest.warmestC != null)
    cells.push({
      key: "warmest",
      label: "Warmest month",
      home: temp(home.warmestC, home.warmestMonth),
      dest: temp(dest.warmestC, dest.warmestMonth),
      hint: "Mean daily temperature of each city's own warmest month",
    });
  if (home.sunnyDays != null && dest.sunnyDays != null)
    cells.push({
      key: "sunny",
      label: "Sunny days",
      home: `${home.sunnyDays} / yr`,
      dest: `${dest.sunnyDays} / yr`,
      hint: "Days with more than 4.5 hours of sunshine over the year",
    });
  if (home.annualPrecipMm != null && dest.annualPrecipMm != null)
    cells.push({
      key: "rain",
      label: "Rain a year",
      home: `${home.annualPrecipMm} mm`,
      dest: `${dest.annualPrecipMm} mm`,
    });
  if (home.humidityPct != null && dest.humidityPct != null)
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
      info: METRIC_INFO[d.parameter],
    });
  }
  return cells;
}

// Small "i" affordance with a hover/focus popover explaining a metric in plain
// language (what SO2/O3/AQI actually mean).
function InfoDot({ text }: { text: string }) {
  return (
    <span className="group/info relative inline-flex shrink-0 align-middle">
      <button
        type="button"
        aria-label={text}
        onClick={(e) => e.preventDefault()}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-stone-300 text-[9px] font-semibold leading-none text-stone-500 transition-colors hover:border-stone-500 hover:text-stone-700"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 w-48 -translate-x-1/2 rounded-md bg-stone-900 px-2.5 py-1.5 text-[11px] font-normal normal-case leading-snug tracking-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100"
      >
        {text}
      </span>
    </span>
  );
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
  aqi?: { home: AqiSide | null; dest: AqiSide | null };
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
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-stone-500">
                <span>{c.label}</span>
                {c.info && <InfoDot text={c.info} />}
              </p>
              <div className="mt-1.5 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] text-stone-500">
                    {c.homeLabel ?? home.label}
                  </span>
                  <span className="tnum shrink-0 text-sm text-stone-500">
                    {c.home}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] text-stone-500">
                    {c.destLabel ?? dest.label}
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

      <p className="text-[11px] text-stone-500">
        {home.label} versus {dest.label}, historical normals from{" "}
        {dest.year ?? home.year}. Sources:{" "}
        {[...sources, aqi && aqi.home && aqi.dest ? "WAQI" : null]
          .filter(Boolean)
          .join(", ")}
        .
      </p>
    </div>
  );
}
