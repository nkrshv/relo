// Accessors over the free-API insights snapshot (countryInsights.generated.ts)
// plus helpers to summarize climate for display and prompt grounding.

import {
  COUNTRY_INSIGHTS,
  INSIGHTS_UPDATED_AT,
  type CountryInsights,
} from "./countryInsights.generated";
import { normalizeName } from "./countryFacts";

const BY_NORM: Record<string, CountryInsights> = Object.fromEntries(
  Object.entries(COUNTRY_INSIGHTS).map(([name, v]) => [normalizeName(name), v]),
);

export function insightsForCountry(country: string): CountryInsights | null {
  return BY_NORM[normalizeName(country)] ?? null;
}

export { INSIGHTS_UPDATED_AT };
export type { CountryInsights };

/** e.g. "Jan 13° · Jul 24° in Lisbon" */
export function climateSummary(ins: CountryInsights): string | null {
  const jan = ins.climate.months[0]?.t;
  const jul = ins.climate.months[6]?.t;
  if (jan == null || jul == null) return null;
  return `Jan ${Math.round(jan)}° · Jul ${Math.round(jul)}°`;
}

/** Months with the most rainy days, e.g. "wettest: Nov-Jan". */
export function wettestMonths(ins: CountryInsights): string | null {
  const months = ins.climate.months;
  if (months.length !== 12) return null;
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ranked = months
    .map((m, i) => ({ i, rd: m.rainyDays }))
    .sort((a, b) => b.rd - a.rd)
    .slice(0, 2)
    .sort((a, b) => a.i - b.i);
  if (ranked.every((r) => months[r.i].rainyDays === 0)) return null;
  return ranked.map((r) => names[r.i]).join(", ");
}
