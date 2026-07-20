// Cost-of-living data for the /cost-of-living/[country] pages, keyed by
// destination slug (src/lib/countries.ts). This is broad, public, sourced cost
// data (rent, groceries, a realistic monthly budget) — the free SEO layer. The
// paid $9 plan is the personalized synthesis; these numbers are not that.
//
// The detailed monthly breakdown is populated per country as it is researched
// against sources (Numbeo / Expatistan / official statistics + tariff pages).
// Countries without an entry render the page from the data we already have
// (Big Mac, EU price level, inflation, salary) and simply omit the budget
// tables — no thin placeholder numbers.

// Month the cost detail was last reviewed.
export const COST_OF_LIVING_VERIFIED = "2026-07";

// A money figure as a low–high range, in both local currency and USD. Costs
// vary a lot, so we never publish a single false-precision number.
export interface MoneyRange {
  /** [low, high] in the local currency's major units. */
  local: [number, number];
  /** [low, high] in USD at the `asOf` month's FX. */
  usd: [number, number];
  /** Optional caveat on this specific figure. */
  note?: string;
}

export type CityTier = "capital" | "major" | "popular_expat";

// One representative city's monthly costs. Every field is optional so a partial
// research result still renders whatever is known.
export interface CityCost {
  city: string;
  tier: CityTier;
  rent1brCenter?: MoneyRange;
  rent1brOutside?: MoneyRange;
  rent3brCenter?: MoneyRange;
  utilitiesBasic?: MoneyRange;
  internet?: MoneyRange;
  mobilePlan?: MoneyRange;
  groceriesSingle?: MoneyRange;
  mealInexpensive?: MoneyRange;
  mealMidForTwo?: MoneyRange;
  publicTransportPass?: MoneyRange;
  /** Realistic all-in monthly budget for one adult (incl. mid-range rent). */
  monthlyBudgetSingle?: MoneyRange;
  /** Realistic all-in monthly budget for a family of four. */
  monthlyBudgetFamily4?: MoneyRange;
}

export interface CostSource {
  label: string;
  url: string;
  /** YYYY-MM the source was accessed. */
  accessed: string;
}

export interface CountryCost {
  /** ISO 4217 code of the local currency the `local` figures are in. */
  currency: string;
  /** YYYY-MM the figures reflect. */
  asOf: string;
  /** 1–3 representative cities, capital first. */
  cities: CityCost[];
  /** Typical monthly private/expat health insurance, USD range. */
  privateHealthInsuranceMonthUsd?: { low: number; high: number; note?: string };
  /** Overall cost-of-living index vs the USA (USA = 100). */
  costIndexVsUsa?: {
    value: number;
    basis: string;
    source: string;
    sourceUrl?: string;
  };
  /** 2–4 honest, specific, decision-useful cost notes. */
  keyCostNotes: string[];
  sources: CostSource[];
}

// Slugs with researched cost detail. Empty until the deep-research data lands;
// countries not listed render from existing data only (see page component).
const COST_DETAIL: Record<string, CountryCost> = {};

export function costDetailForSlug(slug: string): CountryCost | null {
  return COST_DETAIL[slug] ?? null;
}

/** Slugs that have full researched cost detail (drives sitemap + cross-links). */
export function slugsWithCostDetail(): string[] {
  return Object.keys(COST_DETAIL);
}

/** e.g. "$500–$830" or "฿18,000–฿30,000". */
export function formatRange(
  [low, high]: [number, number],
  currency: string,
): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    THB: "฿",
    CHF: "CHF ",
    PLN: "zł ",
    SGD: "S$",
    BRL: "R$",
    MXN: "MX$",
    CAD: "CA$",
    AUD: "A$",
    NZD: "NZ$",
    INR: "₹",
    KRW: "₩",
    VND: "₫",
  };
  const sym = symbols[currency] ?? `${currency} `;
  const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
  return low === high
    ? `${sym}${fmt(low)}`
    : `${sym}${fmt(low)}–${sym}${fmt(high)}`;
}
