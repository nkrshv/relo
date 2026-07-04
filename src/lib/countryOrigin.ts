// Accessor over the lightweight origin layer (countryOrigin.generated.ts):
// capital, UTC offset and capital AQI for any origin country. Used to
// personalize destination cells (timezone diff, AQI delta) against home.

import {
  COUNTRY_ORIGIN,
  type CountryOrigin,
} from "./countryOrigin.generated";
import { normalizeName } from "./countryFacts";

const BY_NORM: Record<string, CountryOrigin> = Object.fromEntries(
  Object.entries(COUNTRY_ORIGIN).map(([name, v]) => [normalizeName(name), v]),
);

export function originForCountry(country: string): CountryOrigin | null {
  return BY_NORM[normalizeName(country)] ?? null;
}

export type { CountryOrigin };
