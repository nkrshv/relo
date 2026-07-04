import { EXCHANGE_RATES } from "@/lib/exchangeRates.generated";
import { currencyForCountry } from "@/lib/countryCurrency";

export { EXCHANGE_RATES };

export interface Conversion {
  fromCode: string;
  toCode: string;
  rate: number; // units of `toCode` per 1 unit of `fromCode`
  updatedAt: string;
}

// Converts one unit of the origin country's currency into the destination
// country's currency using USD-based rates — a live table if provided,
// otherwise the committed snapshot. Returns null if either currency is
// unknown/unsupported, or if the two countries share a currency (nothing
// useful to show).
export function conversionBetween(
  fromCountry: string,
  toCountry: string,
  source?: { rates: Record<string, number>; updatedAt: string } | null,
): Conversion | null {
  const fromCode = currencyForCountry(fromCountry);
  const toCode = currencyForCountry(toCountry);
  if (!fromCode || !toCode || fromCode === toCode) return null;

  const table = source ?? EXCHANGE_RATES;
  const fromRate = table.rates[fromCode];
  const toRate = table.rates[toCode];
  if (!fromRate || !toRate) return null;

  return {
    fromCode,
    toCode,
    rate: toRate / fromRate,
    updatedAt: table.updatedAt,
  };
}

// Formats a rate for display, choosing precision based on magnitude so large
// numbers (e.g. IDR) stay readable and small ones keep useful decimals.
export function formatRate(rate: number): string {
  if (rate >= 1000) return rate.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (rate >= 100) return rate.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (rate >= 1) return rate.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return rate.toLocaleString("en-US", { maximumFractionDigits: 4 });
}
