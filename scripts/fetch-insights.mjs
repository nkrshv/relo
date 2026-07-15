// Offline fetcher for per-destination "living insights" from free, keyless APIs:
//
//   - Climate normals: Open-Meteo Historical Weather API (archive-api.open-meteo.com),
//     aggregated in this script from daily data for the capital city over the
//     last full calendar year -> monthly mean temperature + rainy days.
//   - Public holidays: Nager.Date (date.nager.at), current year.
//   - Inflation (CPI %, latest year): World Bank API (FP.CPI.TOTL.ZG).
//   - Life expectancy at birth: WHO GHO OData API (WHOSIS_000001, both sexes).
//   - Big Mac index (USD price of a Big Mac): The Economist's open dataset.
//
// All are free without API keys, so this can run in the monthly refresh
// automation alongside fetch-advisory.mjs / fetch-rates.mjs.
//
// Usage: node scripts/fetch-insights.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildCountryCatalog } from "./countryCatalog.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "reloka-fetch" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchClimate(d, year) {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${d.lat}&longitude=${d.lon}` +
    `&start_date=${year}-01-01&end_date=${year}-12-31` +
    `&daily=temperature_2m_mean,precipitation_sum,sunshine_duration&timezone=UTC`;
  const json = await getJson(url);
  const dates = json.daily?.time ?? [];
  const temps = json.daily?.temperature_2m_mean ?? [];
  const precs = json.daily?.precipitation_sum ?? [];
  const suns = json.daily?.sunshine_duration ?? [];
  const byMonth = Array.from({ length: 12 }, () => ({ tSum: 0, tN: 0, rainy: 0 }));
  dates.forEach((date, i) => {
    const m = Number(date.slice(5, 7)) - 1;
    if (typeof temps[i] === "number") {
      byMonth[m].tSum += temps[i];
      byMonth[m].tN += 1;
    }
    if (typeof precs[i] === "number" && precs[i] >= 1) byMonth[m].rainy += 1;
  });
  // "Sunny day": more than 4.5 hours of sunshine (16,200 s). Only trust the
  // count when the year is reasonably complete.
  const sunReadings = suns.filter((s) => typeof s === "number");
  const sunnyDays =
    sunReadings.length >= 300
      ? sunReadings.filter((s) => s > 4.5 * 3600).length
      : null;
  return {
    months: byMonth.map((m) => ({
      t: m.tN ? Number((m.tSum / m.tN).toFixed(1)) : null,
      rainyDays: m.rainy,
    })),
    sunnyDays,
  };
}

async function fetchHolidays(d, year) {
  // Nager.Date returns 204 (empty body) for unsupported countries (e.g. AE).
  let json;
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${d.iso2}`);
    if (!res.ok || res.status === 204) return null;
    json = await res.json();
  } catch {
    return null;
  }
  if (!Array.isArray(json) || json.length === 0) return null;
  const national = json.filter((h) => h.global !== false);
  return {
    count: national.length,
    sample: national.slice(0, 20).map((h) => ({ date: h.date, name: h.name })),
  };
}

async function fetchWorldBank(d, indicator) {
  try {
    const json = await getJson(
      `https://api.worldbank.org/v2/country/${d.iso2}/indicator/${indicator}?format=json&per_page=70`,
    );
    const row = (json?.[1] ?? []).find((r) => typeof r.value === "number");
    if (!row) return null;
    return { value: Number(row.value.toFixed(2)), year: row.date };
  } catch {
    return null;
  }
}

// Same as fetchWorldBank but keeps the value as a rounded integer (for counts
// like total population where fractional people make no sense).
async function fetchWorldBankInt(d, indicator) {
  try {
    const json = await getJson(
      `https://api.worldbank.org/v2/country/${d.iso2}/indicator/${indicator}?format=json&per_page=70`,
    );
    const row = (json?.[1] ?? []).find((r) => typeof r.value === "number");
    if (!row) return null;
    return { value: Math.round(row.value), year: row.date };
  } catch {
    return null;
  }
}

async function fetchLifeExpectancy(d) {
  try {
    const json = await getJson(
      `https://ghoapi.azureedge.net/api/WHOSIS_000001?$filter=SpatialDim eq '${d.iso3}' and Dim1 eq 'SEX_BTSX'`.replaceAll(" ", "%20"),
    );
    const rows = (json.value ?? []).filter((r) => typeof r.NumericValue === "number");
    if (!rows.length) return null;
    rows.sort((a, b) => b.TimeDim - a.TimeDim);
    return { value: Number(rows[0].NumericValue.toFixed(1)), year: String(rows[0].TimeDim) };
  } catch {
    return null;
  }
}

async function fetchBigMac() {
  const res = await fetch(
    "https://raw.githubusercontent.com/TheEconomist/big-mac-data/master/output-data/big-mac-full-index.csv",
  );
  if (!res.ok) return {};
  const lines = (await res.text()).trim().split("\n");
  const header = lines[0].split(",");
  const iDate = header.indexOf("date");
  const iIso = header.indexOf("iso_a3");
  const iPrice = header.indexOf("dollar_price");
  const latest = {};
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const iso = cells[iIso];
    const date = cells[iDate];
    const price = Number(cells[iPrice]);
    if (!iso || !Number.isFinite(price)) continue;
    if (!latest[iso] || date > latest[iso].date) latest[iso] = { date, price };
  }
  return latest;
}

const EUROZONE = new Set(["PRT", "ESP", "DEU", "NLD", "FRA", "ITA", "IRL", "EST"]);

async function main() {
  const now = new Date();
  const lastFullYear = now.getUTCFullYear() - 1;
  const holidayYear = now.getUTCFullYear();
  const bigMac = await fetchBigMac();

  // Climate + migrant share are keyless world-wide layers, so cover every
  // officially-assigned country, not just the curated destinations. Countries
  // where a given source has no data keep null for that field (scalable logic).
  process.stdout.write("Building country catalog... ");
  const countries = await buildCountryCatalog();
  console.log(`${countries.length} countries`);

  const insights = {};
  const CONCURRENCY = 6;
  let i = 0;
  let done = 0;
  async function worker() {
    while (i < countries.length) {
      const d = countries[i++];
      const [
        climate,
        holidays,
        inflation,
        lifeExpectancy,
        migrantShare,
        density,
        unemployment,
        population,
      ] = await Promise.all([
        d.lat != null && d.lon != null
          ? fetchClimate(d, lastFullYear).catch(() => ({
              months: [],
              sunnyDays: null,
            }))
          : Promise.resolve({ months: [], sunnyDays: null }),
        fetchHolidays(d, holidayYear),
        fetchWorldBank(d, "FP.CPI.TOTL.ZG"),
        fetchLifeExpectancy(d),
        fetchWorldBank(d, "SM.POP.TOTL.ZS"),
        fetchWorldBank(d, "EN.POP.DNST"),
        fetchWorldBank(d, "SL.UEM.TOTL.ZS"),
        fetchWorldBankInt(d, "SP.POP.TOTL"),
      ]);
      // The Economist prices the euro area as a single "EUZ" entry.
      const bm = bigMac[d.iso3] ?? (EUROZONE.has(d.iso3) ? bigMac.EUZ : null) ?? null;
      const hasClimate = climate.months.some((m) => m.t != null);
      // Skip countries with nothing worth showing at all.
      if (
        !hasClimate &&
        !inflation &&
        !lifeExpectancy &&
        !migrantShare &&
        !bm &&
        !holidays &&
        !density &&
        !unemployment &&
        !population
      ) {
        done += 1;
        continue;
      }
      insights[d.name] = {
        iso2: d.iso2,
        capital: d.capital,
        climate: {
          city: d.capital,
          year: String(lastFullYear),
          months: climate.months,
          sunnyDays: climate.sunnyDays,
        },
        holidays: holidays ? { year: String(holidayYear), ...holidays } : null,
        inflation,
        lifeExpectancy,
        migrantShare,
        bigMacUsd: bm ? { value: Number(bm.price.toFixed(2)), date: bm.date } : null,
        density,
        unemployment,
        population,
      };
      done += 1;
      if (done % 25 === 0)
        console.log(`  ${done}/${countries.length} fetched...`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const header = `// AUTO-GENERATED by scripts/fetch-insights.mjs — do not edit by hand.
// Sources (all free, keyless): Open-Meteo historical weather (climate),
// Nager.Date (public holidays), World Bank API (inflation, migrant stock %,
// population density, unemployment rate, total population),
// WHO GHO (life expectancy), The Economist big-mac-data (Big Mac USD price).
// Regenerate with: node scripts/fetch-insights.mjs

export interface ClimateMonth {
  /** Mean daily temperature, °C. */
  t: number | null;
  /** Days with >= 1 mm precipitation. */
  rainyDays: number;
}

export interface CountryInsights {
  iso2: string;
  capital: string;
  climate: {
    city: string;
    year: string;
    months: ClimateMonth[];
    /** Days in the year with more than 4.5 hours of sunshine. */
    sunnyDays: number | null;
  };
  holidays: {
    year: string;
    count: number;
    sample: { date: string; name: string }[];
  } | null;
  inflation: { value: number; year: string } | null;
  lifeExpectancy: { value: number; year: string } | null;
  /** International migrant stock as a share of population (World Bank). */
  migrantShare: { value: number; year: string } | null;
  bigMacUsd: { value: number; date: string } | null;
  /** People per square kilometre, country-wide (World Bank EN.POP.DNST). */
  density: { value: number; year: string } | null;
  /** Unemployment, % of total labour force (World Bank SL.UEM.TOTL.ZS). */
  unemployment: { value: number; year: string } | null;
  /** Total country population (World Bank SP.POP.TOTL). */
  population: { value: number; year: string } | null;
}

export const INSIGHTS_UPDATED_AT = ${JSON.stringify(now.toISOString().slice(0, 10))};

export const COUNTRY_INSIGHTS: Record<string, CountryInsights> = ${JSON.stringify(insights, null, 2)};
`;

  writeFileSync(join(ROOT, "src/lib/countryInsights.generated.ts"), header);
  console.log(`Wrote insights for ${Object.keys(insights).length} destinations.`);
}

main();
