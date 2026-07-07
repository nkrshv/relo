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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Curated destinations (must match src/lib/countries.ts) with ISO codes and
// capital coordinates for climate lookups.
const DESTINATIONS = [
  { name: "Portugal", iso2: "PT", iso3: "PRT", capital: "Lisbon", lat: 38.72, lon: -9.14 },
  { name: "Spain", iso2: "ES", iso3: "ESP", capital: "Madrid", lat: 40.42, lon: -3.7 },
  { name: "Germany", iso2: "DE", iso3: "DEU", capital: "Berlin", lat: 52.52, lon: 13.4 },
  { name: "Netherlands", iso2: "NL", iso3: "NLD", capital: "Amsterdam", lat: 52.37, lon: 4.9 },
  { name: "France", iso2: "FR", iso3: "FRA", capital: "Paris", lat: 48.86, lon: 2.35 },
  { name: "Italy", iso2: "IT", iso3: "ITA", capital: "Rome", lat: 41.9, lon: 12.5 },
  { name: "Ireland", iso2: "IE", iso3: "IRL", capital: "Dublin", lat: 53.35, lon: -6.26 },
  { name: "United Kingdom", iso2: "GB", iso3: "GBR", capital: "London", lat: 51.51, lon: -0.13 },
  { name: "United States", iso2: "US", iso3: "USA", capital: "Washington, D.C.", lat: 38.9, lon: -77.04 },
  { name: "Canada", iso2: "CA", iso3: "CAN", capital: "Ottawa", lat: 45.42, lon: -75.7 },
  { name: "Australia", iso2: "AU", iso3: "AUS", capital: "Canberra", lat: -35.28, lon: 149.13 },
  { name: "United Arab Emirates", iso2: "AE", iso3: "ARE", capital: "Abu Dhabi", lat: 24.45, lon: 54.38 },
  { name: "Estonia", iso2: "EE", iso3: "EST", capital: "Tallinn", lat: 59.44, lon: 24.75 },
  { name: "Poland", iso2: "PL", iso3: "POL", capital: "Warsaw", lat: 52.23, lon: 21.01 },
  { name: "Mexico", iso2: "MX", iso3: "MEX", capital: "Mexico City", lat: 19.43, lon: -99.13 },
  { name: "Thailand", iso2: "TH", iso3: "THA", capital: "Bangkok", lat: 13.76, lon: 100.5 },
  { name: "Japan", iso2: "JP", iso3: "JPN", capital: "Tokyo", lat: 35.68, lon: 139.69 },
  { name: "Singapore", iso2: "SG", iso3: "SGP", capital: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Greece", iso2: "GR", iso3: "GRC", capital: "Athens", lat: 37.98, lon: 23.73 },
  { name: "Cyprus", iso2: "CY", iso3: "CYP", capital: "Nicosia", lat: 35.19, lon: 33.38 },
  { name: "Malta", iso2: "MT", iso3: "MLT", capital: "Valletta", lat: 35.9, lon: 14.51 },
  { name: "Switzerland", iso2: "CH", iso3: "CHE", capital: "Bern", lat: 46.95, lon: 7.45 },
  { name: "Austria", iso2: "AT", iso3: "AUT", capital: "Vienna", lat: 48.21, lon: 16.37 },
  { name: "Czechia", iso2: "CZ", iso3: "CZE", capital: "Prague", lat: 50.08, lon: 14.44 },
  { name: "Georgia", iso2: "GE", iso3: "GEO", capital: "Tbilisi", lat: 41.72, lon: 44.79 },
  { name: "Armenia", iso2: "AM", iso3: "ARM", capital: "Yerevan", lat: 40.18, lon: 44.51 },
  { name: "Turkey", iso2: "TR", iso3: "TUR", capital: "Ankara", lat: 39.93, lon: 32.86 },
  { name: "Brazil", iso2: "BR", iso3: "BRA", capital: "Brasília", lat: -15.79, lon: -47.88 },
  { name: "Argentina", iso2: "AR", iso3: "ARG", capital: "Buenos Aires", lat: -34.6, lon: -58.38 },
  { name: "Uruguay", iso2: "UY", iso3: "URY", capital: "Montevideo", lat: -34.9, lon: -56.19 },
  { name: "Costa Rica", iso2: "CR", iso3: "CRI", capital: "San José", lat: 9.93, lon: -84.08 },
  { name: "Panama", iso2: "PA", iso3: "PAN", capital: "Panama City", lat: 8.98, lon: -79.52 },
  { name: "Colombia", iso2: "CO", iso3: "COL", capital: "Bogotá", lat: 4.71, lon: -74.07 },
  { name: "Malaysia", iso2: "MY", iso3: "MYS", capital: "Kuala Lumpur", lat: 3.14, lon: 101.69 },
  { name: "Indonesia", iso2: "ID", iso3: "IDN", capital: "Jakarta", lat: -6.21, lon: 106.85 },
  { name: "Vietnam", iso2: "VN", iso3: "VNM", capital: "Hanoi", lat: 21.03, lon: 105.85 },
  { name: "New Zealand", iso2: "NZ", iso3: "NZL", capital: "Wellington", lat: -41.29, lon: 174.78 },
];

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "reloka-fetch" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchClimate(d, year) {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${d.lat}&longitude=${d.lon}` +
    `&start_date=${year}-01-01&end_date=${year}-12-31` +
    `&daily=temperature_2m_mean,precipitation_sum&timezone=UTC`;
  const json = await getJson(url);
  const dates = json.daily?.time ?? [];
  const temps = json.daily?.temperature_2m_mean ?? [];
  const precs = json.daily?.precipitation_sum ?? [];
  const byMonth = Array.from({ length: 12 }, () => ({ tSum: 0, tN: 0, rainy: 0 }));
  dates.forEach((date, i) => {
    const m = Number(date.slice(5, 7)) - 1;
    if (typeof temps[i] === "number") {
      byMonth[m].tSum += temps[i];
      byMonth[m].tN += 1;
    }
    if (typeof precs[i] === "number" && precs[i] >= 1) byMonth[m].rainy += 1;
  });
  return byMonth.map((m) => ({
    t: m.tN ? Number((m.tSum / m.tN).toFixed(1)) : null,
    rainyDays: m.rainy,
  }));
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

  const insights = {};
  for (const d of DESTINATIONS) {
    process.stdout.write(`Fetching ${d.name}... `);
    const [climate, holidays, inflation, lifeExpectancy] = await Promise.all([
      fetchClimate(d, lastFullYear).catch(() => []),
      fetchHolidays(d, holidayYear),
      fetchWorldBank(d, "FP.CPI.TOTL.ZG"),
      fetchLifeExpectancy(d),
    ]);
    // The Economist prices the euro area as a single "EUZ" entry.
    const bm = bigMac[d.iso3] ?? (EUROZONE.has(d.iso3) ? bigMac.EUZ : null) ?? null;
    insights[d.name] = {
      iso2: d.iso2,
      capital: d.capital,
      climate: { city: d.capital, year: String(lastFullYear), months: climate },
      holidays: holidays ? { year: String(holidayYear), ...holidays } : null,
      inflation,
      lifeExpectancy,
      bigMacUsd: bm ? { value: Number(bm.price.toFixed(2)), date: bm.date } : null,
    };
    console.log("done");
  }

  const header = `// AUTO-GENERATED by scripts/fetch-insights.mjs — do not edit by hand.
// Sources (all free, keyless): Open-Meteo historical weather (climate),
// Nager.Date (public holidays), World Bank API (inflation),
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
  climate: { city: string; year: string; months: ClimateMonth[] };
  holidays: {
    year: string;
    count: number;
    sample: { date: string; name: string }[];
  } | null;
  inflation: { value: number; year: string } | null;
  lifeExpectancy: { value: number; year: string } | null;
  bigMacUsd: { value: number; date: string } | null;
}

export const INSIGHTS_UPDATED_AT = ${JSON.stringify(now.toISOString().slice(0, 10))};

export const COUNTRY_INSIGHTS: Record<string, CountryInsights> = ${JSON.stringify(insights, null, 2)};
`;

  writeFileSync(join(ROOT, "src/lib/countryInsights.generated.ts"), header);
  console.log(`Wrote insights for ${Object.keys(insights).length} destinations.`);
}

main();
