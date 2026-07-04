// Accessors over the extra open-data snapshot (countryOpenData.generated.ts):
// calling code, driving side, timezone, EU price level, OECD tax wedge,
// universities, capital air quality and OpenStreetMap office names.

import {
  COUNTRY_OPEN_DATA,
  OPEN_DATA_UPDATED_AT,
  type CountryOpenData,
} from "./countryOpenData.generated";
import { normalizeName } from "./countryFacts";

const BY_NORM: Record<string, CountryOpenData> = Object.fromEntries(
  Object.entries(COUNTRY_OPEN_DATA).map(([name, v]) => [normalizeName(name), v]),
);

export function openDataForCountry(country: string): CountryOpenData | null {
  return BY_NORM[normalizeName(country)] ?? null;
}

export { OPEN_DATA_UPDATED_AT };
export type { CountryOpenData };

/** Plain-language AQI band (US EPA scale). */
export function aqiLabel(aqi: number): { text: string; tone: "good" | "moderate" | "bad" } {
  if (aqi <= 50) return { text: "Good", tone: "good" };
  if (aqi <= 100) return { text: "Moderate", tone: "moderate" };
  if (aqi <= 150) return { text: "Unhealthy for sensitive groups", tone: "bad" };
  if (aqi <= 200) return { text: "Unhealthy", tone: "bad" };
  return { text: "Very unhealthy", tone: "bad" };
}
