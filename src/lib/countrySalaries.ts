// Accessors over the Adzuna salary snapshot (countrySalaries.generated.ts).
// Adzuna only covers a subset of destinations; countries without data simply
// have no entry and callers hide the block entirely.

import {
  COUNTRY_SALARIES,
  SALARIES_UPDATED_AT,
  type CountrySalary,
} from "./countrySalaries.generated";
import { normalizeName } from "./countryFacts";

const BY_NORM: Record<string, CountrySalary> = Object.fromEntries(
  Object.entries(COUNTRY_SALARIES).map(([name, v]) => [normalizeName(name), v]),
);

export function salaryForCountry(country: string): CountrySalary | null {
  return BY_NORM[normalizeName(country)] ?? null;
}

export { SALARIES_UPDATED_AT };
export type { CountrySalary };

/** e.g. "€44,600" — local currency symbol where common, code otherwise. */
export function formatSalary(value: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CHF: "CHF ",
    PLN: "zł ",
    SGD: "S$",
    BRL: "R$",
    MXN: "MX$",
    CAD: "CA$",
    AUD: "A$",
    NZD: "NZ$",
  };
  const sym = symbols[currency] ?? `${currency} `;
  return `${sym}${Math.round(value).toLocaleString("en-US")}`;
}
