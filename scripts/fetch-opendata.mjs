// Offline fetcher for an extra per-destination open-data layer:
//
//   - Calling code: mledoze/countries dataset (the open dataset behind
//     REST Countries; the hosted API now requires a key, the raw data doesn't).
//   - Capital timezone: Open-Meteo forecast API (timezone=auto for capital coords).
//   - Price level index (EU27=100): Eurostat tec00120 (household consumption PLI).
//   - Tax wedge (single worker, 100% average wage): OECD SDMX,
//     Labour taxation comparative tables (DSD_TAX_WAGES_COMP@DF_TW_COMP, AV_TW).
//   - Universities: Hipolabs universities API (count + sample).
//   - Air quality in the capital: WAQI city feed. Requires WAQI_TOKEN env var;
//     skipped (kept as null) when the token is missing.
//   - Local government offices (townhalls) near the capital: OpenStreetMap
//     Overpass API. Best-effort: Overpass is often busy, failures are kept null.
//
// Driving side never changes, so it is curated inline here rather than fetched.
//
// Usage: WAQI_TOKEN=... node scripts/fetch-opendata.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Must match src/lib/countries.ts / fetch-insights.mjs.
const DESTINATIONS = [
  { name: "Portugal", iso2: "PT", iso3: "PRT", capital: "Lisbon", lat: 38.72, lon: -9.14, drive: "right", eu: true },
  { name: "Spain", iso2: "ES", iso3: "ESP", capital: "Madrid", lat: 40.42, lon: -3.7, drive: "right", eu: true },
  { name: "Germany", iso2: "DE", iso3: "DEU", capital: "Berlin", lat: 52.52, lon: 13.4, drive: "right", eu: true },
  { name: "Netherlands", iso2: "NL", iso3: "NLD", capital: "Amsterdam", lat: 52.37, lon: 4.9, drive: "right", eu: true },
  { name: "France", iso2: "FR", iso3: "FRA", capital: "Paris", lat: 48.86, lon: 2.35, drive: "right", eu: true },
  { name: "Italy", iso2: "IT", iso3: "ITA", capital: "Rome", lat: 41.9, lon: 12.5, drive: "right", eu: true },
  { name: "Ireland", iso2: "IE", iso3: "IRL", capital: "Dublin", lat: 53.35, lon: -6.26, drive: "left", eu: true },
  { name: "United Kingdom", iso2: "GB", iso3: "GBR", capital: "London", lat: 51.51, lon: -0.13, drive: "left", eu: false },
  { name: "United States", iso2: "US", iso3: "USA", capital: "Washington, D.C.", lat: 38.9, lon: -77.04, drive: "right", eu: false },
  { name: "Canada", iso2: "CA", iso3: "CAN", capital: "Ottawa", lat: 45.42, lon: -75.7, drive: "right", eu: false },
  { name: "Australia", iso2: "AU", iso3: "AUS", capital: "Canberra", lat: -35.28, lon: 149.13, drive: "left", eu: false },
  { name: "United Arab Emirates", iso2: "AE", iso3: "ARE", capital: "Abu Dhabi", lat: 24.45, lon: 54.38, drive: "right", eu: false },
  { name: "Estonia", iso2: "EE", iso3: "EST", capital: "Tallinn", lat: 59.44, lon: 24.75, drive: "right", eu: true },
  { name: "Poland", iso2: "PL", iso3: "POL", capital: "Warsaw", lat: 52.23, lon: 21.01, drive: "right", eu: true },
  { name: "Mexico", iso2: "MX", iso3: "MEX", capital: "Mexico City", lat: 19.43, lon: -99.13, drive: "right", eu: false },
  { name: "Thailand", iso2: "TH", iso3: "THA", capital: "Bangkok", lat: 13.76, lon: 100.5, drive: "left", eu: false },
  { name: "Japan", iso2: "JP", iso3: "JPN", capital: "Tokyo", lat: 35.68, lon: 139.69, drive: "left", eu: false },
  { name: "Singapore", iso2: "SG", iso3: "SGP", capital: "Singapore", lat: 1.35, lon: 103.82, drive: "left", eu: false },
  { name: "Greece", iso2: "GR", iso3: "GRC", capital: "Athens", lat: 37.98, lon: 23.73, drive: "right", eu: true },
  { name: "Cyprus", iso2: "CY", iso3: "CYP", capital: "Nicosia", lat: 35.19, lon: 33.38, drive: "left", eu: true },
  { name: "Malta", iso2: "MT", iso3: "MLT", capital: "Valletta", lat: 35.9, lon: 14.51, drive: "left", eu: true },
  { name: "Switzerland", iso2: "CH", iso3: "CHE", capital: "Bern", lat: 46.95, lon: 7.45, drive: "right", eu: false },
  { name: "Austria", iso2: "AT", iso3: "AUT", capital: "Vienna", lat: 48.21, lon: 16.37, drive: "right", eu: true },
  { name: "Czechia", iso2: "CZ", iso3: "CZE", capital: "Prague", lat: 50.08, lon: 14.44, drive: "right", eu: true },
  { name: "Georgia", iso2: "GE", iso3: "GEO", capital: "Tbilisi", lat: 41.72, lon: 44.79, drive: "right", eu: false },
  { name: "Armenia", iso2: "AM", iso3: "ARM", capital: "Yerevan", lat: 40.18, lon: 44.51, drive: "right", eu: false },
  { name: "Turkey", iso2: "TR", iso3: "TUR", capital: "Ankara", lat: 39.93, lon: 32.86, drive: "right", eu: false },
  { name: "Brazil", iso2: "BR", iso3: "BRA", capital: "Brasília", lat: -15.79, lon: -47.88, drive: "right", eu: false },
  { name: "Argentina", iso2: "AR", iso3: "ARG", capital: "Buenos Aires", lat: -34.6, lon: -58.38, drive: "right", eu: false },
  { name: "Uruguay", iso2: "UY", iso3: "URY", capital: "Montevideo", lat: -34.9, lon: -56.19, drive: "right", eu: false },
  { name: "Costa Rica", iso2: "CR", iso3: "CRI", capital: "San José", lat: 9.93, lon: -84.08, drive: "right", eu: false },
  { name: "Panama", iso2: "PA", iso3: "PAN", capital: "Panama City", lat: 8.98, lon: -79.52, drive: "right", eu: false },
  { name: "Colombia", iso2: "CO", iso3: "COL", capital: "Bogotá", lat: 4.71, lon: -74.07, drive: "right", eu: false },
  { name: "Malaysia", iso2: "MY", iso3: "MYS", capital: "Kuala Lumpur", lat: 3.14, lon: 101.69, drive: "left", eu: false },
  { name: "Indonesia", iso2: "ID", iso3: "IDN", capital: "Jakarta", lat: -6.21, lon: 106.85, drive: "left", eu: false },
  { name: "Vietnam", iso2: "VN", iso3: "VNM", capital: "Hanoi", lat: 21.03, lon: 105.85, drive: "right", eu: false },
  { name: "New Zealand", iso2: "NZ", iso3: "NZL", capital: "Wellington", lat: -41.29, lon: 174.78, drive: "left", eu: false },
];

async function getJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": "reloka-fetch", ...headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchAllCountries() {
  return getJson(
    "https://raw.githubusercontent.com/mledoze/countries/master/countries.json",
  );
}

function callingCodes(json) {
  const byIso2 = {};
  for (const c of json) {
    const root = c.idd?.root ?? "";
    const suffixes = c.idd?.suffixes ?? [];
    if (!root) continue;
    // Countries like the US share one suffix-less code; NANP members list many.
    byIso2[c.cca2] = suffixes.length === 1 ? `${root}${suffixes[0]}` : root;
  }
  return byIso2;
}

async function fetchTimezone(d) {
  try {
    const json = await getJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${d.lat}&longitude=${d.lon}&timezone=auto`,
    );
    if (!json.timezone) return null;
    const h = json.utc_offset_seconds / 3600;
    const sign = h >= 0 ? "+" : "-";
    const abs = Math.abs(h);
    const offset = `UTC${sign}${Number.isInteger(abs) ? abs : abs.toFixed(1)}`;
    return { name: json.timezone, offset };
  } catch {
    return null;
  }
}

async function fetchEurostatPli() {
  // Price level indices for household consumption, EU27_2020 = 100.
  const json = await getJson(
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tec00120?format=JSON&lastTimePeriod=1",
  );
  const geoIndex = json.dimension?.geo?.category?.index ?? {};
  const time = Object.keys(json.dimension?.time?.category?.index ?? {})[0] ?? "";
  const geoSize = json.size[json.id.indexOf("geo")];
  const timeSize = json.size[json.id.indexOf("time")];
  const byIso2 = {};
  for (const [geo, gi] of Object.entries(geoIndex)) {
    const v = json.value?.[gi * timeSize];
    if (typeof v === "number" && geo.length === 2)
      byIso2[geo === "EL" ? "GR" : geo] = { value: v, year: time };
  }
  if (geoSize === 0) return {};
  return byIso2;
}

async function fetchTaxWedge(d) {
  // Average tax wedge, single worker without children at 100% of average wage.
  // The OECD SDMX API throttles bursts, so retry with backoff.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const json = await getJson(
        `https://sdmx.oecd.org/public/rest/data/OECD.CTP.TPS,DSD_TAX_WAGES_COMP@DF_TW_COMP,/${d.iso3}.AV_TW..S_C0.AW100._Z.A?lastNObservations=1&dimensionAtObservation=AllDimensions&format=jsondata`,
        // Without Accept-Language the OECD API 500s ("languageTag" error).
        { Accept: "application/vnd.sdmx.data+json", "Accept-Language": "en" },
      );
      const dims = json.data.structures[0].dimensions.observation;
      const iTime = dims.findIndex((x) => x.id === "TIME_PERIOD");
      const obs = json.data.dataSets[0].observations;
      for (const [key, val] of Object.entries(obs)) {
        const year = dims[iTime].values[Number(key.split(":")[iTime])].id;
        if (typeof val[0] === "number")
          return { value: Number(val[0].toFixed(1)), year };
      }
      return null;
    } catch {
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  return null;
}

async function fetchUniversities(d) {
  try {
    const json = await getJson(
      `http://universities.hipolabs.com/search?country=${encodeURIComponent(d.name)}`,
    );
    if (!Array.isArray(json) || json.length === 0) return null;
    const names = [...new Set(json.map((u) => u.name))];
    return { count: names.length, sample: names.slice(0, 5) };
  } catch {
    return null;
  }
}

async function fetchAirQuality(d, token) {
  if (!token) return null;
  try {
    const city = d.capital.replace(/,.*$/, "").toLowerCase();
    const json = await getJson(
      `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${token}`,
    );
    if (json.status !== "ok" || typeof json.data?.aqi !== "number") return null;
    return {
      aqi: json.data.aqi,
      dominant: json.data.dominentpol ?? null,
      station: json.data.city?.name ?? d.capital,
    };
  } catch {
    return null;
  }
}

async function geocodeCapital(capital, iso2) {
  try {
    const json = await getJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(capital)}&count=5`,
    );
    const hit =
      (json.results ?? []).find((r) => r.country_code === iso2) ??
      json.results?.[0];
    if (!hit) return null;
    return { lat: hit.latitude, lon: hit.longitude };
  } catch {
    return null;
  }
}

async function fetchUtcOffsetHours(lat, lon) {
  try {
    const json = await getJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto`,
    );
    if (!json.timezone) return null;
    return json.utc_offset_seconds / 3600;
  } catch {
    return null;
  }
}

async function fetchAirQualityByGeo(lat, lon, token) {
  if (!token) return null;
  try {
    const json = await getJson(
      `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`,
    );
    if (json.status !== "ok" || typeof json.data?.aqi !== "number") return null;
    return json.data.aqi;
  } catch {
    return null;
  }
}

// Lightweight per-origin layer for ALL countries (not just the 18 curated
// destinations): capital name, UTC offset in hours and capital AQI. Used to
// personalize destination cells (timezone diff, AQI delta) against the
// user's origin country.
async function fetchOrigins(allCountries, token) {
  const origins = {};
  const queue = allCountries.filter(
    (c) => c.capital?.[0] && c.status === "officially-assigned",
  );
  const CONCURRENCY = 8;
  let i = 0;
  async function worker() {
    while (i < queue.length) {
      const c = queue[i++];
      const capital = c.capital[0];
      const geo = await geocodeCapital(capital, c.cca2);
      if (!geo) continue;
      const [offsetHours, aqi] = await Promise.all([
        fetchUtcOffsetHours(geo.lat, geo.lon),
        fetchAirQualityByGeo(geo.lat, geo.lon, token),
      ]);
      if (offsetHours === null && aqi === null) continue;
      origins[c.name.common] = { capital, offsetHours, aqi };
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return origins;
}

async function fetchOffices(d) {
  // Townhalls / city registration offices near the capital, from OpenStreetMap.
  const query = `[out:json][timeout:50];nwr(around:10000,${d.lat},${d.lon})[amenity=townhall][name];out tags 12;`;
  for (const endpoint of [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ]) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "User-Agent": "reloka-fetch",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) continue;
      const json = await res.json();
      const names = [
        ...new Set(
          (json.elements ?? [])
            .map((e) => e.tags?.["name:en"] ?? e.tags?.name)
            .filter(Boolean),
        ),
      ].slice(0, 5);
      if (names.length) return names;
    } catch {
      // try next endpoint
    }
  }
  return null;
}

async function main() {
  const token = process.env.WAQI_TOKEN ?? "";
  if (!token) console.warn("WAQI_TOKEN not set — air quality will be null.");
  const [allCountries, pli] = await Promise.all([
    fetchAllCountries(),
    fetchEurostatPli().catch(() => ({})),
  ]);
  const codes = callingCodes(allCountries);

  process.stdout.write("Fetching origin layer for all countries... ");
  const origins = await fetchOrigins(allCountries, token);
  console.log(`done (${Object.keys(origins).length} countries)`);

  const data = {};
  for (const d of DESTINATIONS) {
    process.stdout.write(`Fetching ${d.name}... `);
    const [timezone, taxWedge, universities, airQuality, offices] =
      await Promise.all([
        fetchTimezone(d),
        fetchTaxWedge(d),
        fetchUniversities(d),
        fetchAirQuality(d, token),
        fetchOffices(d),
      ]);
    data[d.name] = {
      iso2: d.iso2,
      capital: d.capital,
      drivingSide: d.drive,
      callingCode: codes[d.iso2] ?? null,
      timezone,
      priceLevelEU: d.eu ? (pli[d.iso2] ?? null) : null,
      taxWedge,
      universities,
      airQuality,
      offices,
    };
    console.log("done");
  }

  const header = `// AUTO-GENERATED by scripts/fetch-opendata.mjs — do not edit by hand.
// Sources: mledoze/countries (calling codes), Open-Meteo (capital timezone),
// Eurostat tec00120 (price level index, EU27=100), OECD Taxing Wages (tax wedge,
// single worker at 100% average wage), Hipolabs (universities),
// WAQI (air quality in the capital; needs WAQI_TOKEN), OpenStreetMap Overpass
// (townhalls near the capital).
// Regenerate with: WAQI_TOKEN=... node scripts/fetch-opendata.mjs

export interface CountryOpenData {
  iso2: string;
  capital: string;
  drivingSide: "left" | "right";
  callingCode: string | null;
  timezone: { name: string; offset: string } | null;
  /** Household consumption price level index, EU27_2020 = 100. EU members only. */
  priceLevelEU: { value: number; year: string } | null;
  /** Average tax wedge, single worker at 100% of the average wage, % of labour cost. */
  taxWedge: { value: number; year: string } | null;
  universities: { count: number; sample: string[] } | null;
  /** Live AQI in the capital at fetch time (US EPA scale). */
  airQuality: { aqi: number; dominant: string | null; station: string } | null;
  /** Townhall / local government office names near the capital (OpenStreetMap). */
  offices: string[] | null;
}

export const OPEN_DATA_UPDATED_AT = ${JSON.stringify(new Date().toISOString().slice(0, 10))};

export const COUNTRY_OPEN_DATA: Record<string, CountryOpenData> = ${JSON.stringify(data, null, 2)};
`;

  writeFileSync(join(ROOT, "src/lib/countryOpenData.generated.ts"), header);
  console.log(`Wrote open data for ${Object.keys(data).length} destinations.`);

  const originHeader = `// AUTO-GENERATED by scripts/fetch-opendata.mjs — do not edit by hand.
// Lightweight origin layer for all countries: capital, UTC offset (hours, at
// fetch time — DST-dependent) and capital AQI (WAQI, at fetch time). Used to
// personalize destination data against the user's origin country.
// Regenerate with: WAQI_TOKEN=... node scripts/fetch-opendata.mjs

export interface CountryOrigin {
  capital: string;
  offsetHours: number | null;
  aqi: number | null;
}

export const COUNTRY_ORIGIN: Record<string, CountryOrigin> = ${JSON.stringify(origins, null, 2)};
`;
  writeFileSync(join(ROOT, "src/lib/countryOrigin.generated.ts"), originHeader);
  console.log(`Wrote origin layer for ${Object.keys(origins).length} countries.`);
}

main();
