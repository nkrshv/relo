// Shared country catalog for the "cheap" data layers (climate insights and
// OONI messenger reachability). These layers are keyless and cover the whole
// world, so we build the list from the open mledoze/countries dataset and
// enrich each capital with coordinates (geocoded once) for climate lookups.
//
// The 38 curated destinations (src/lib/countries.ts) keep hand-picked capital
// names and coordinates via CURATED overrides so their existing snapshots do
// not drift; every other officially-assigned country is added on top so any
// origin/destination gets climate + messenger signals when data exists.

const MLEDOZE =
  "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";

// iso2 -> { name, iso3, capital, lat, lon } for the curated destinations.
// Names/capitals match src/lib/countries.ts and the historical fetch arrays.
const CURATED = {
  PT: { name: "Portugal", iso3: "PRT", capital: "Lisbon", lat: 38.72, lon: -9.14 },
  ES: { name: "Spain", iso3: "ESP", capital: "Madrid", lat: 40.42, lon: -3.7 },
  DE: { name: "Germany", iso3: "DEU", capital: "Berlin", lat: 52.52, lon: 13.4 },
  NL: { name: "Netherlands", iso3: "NLD", capital: "Amsterdam", lat: 52.37, lon: 4.9 },
  FR: { name: "France", iso3: "FRA", capital: "Paris", lat: 48.86, lon: 2.35 },
  IT: { name: "Italy", iso3: "ITA", capital: "Rome", lat: 41.9, lon: 12.5 },
  IE: { name: "Ireland", iso3: "IRL", capital: "Dublin", lat: 53.35, lon: -6.26 },
  GB: { name: "United Kingdom", iso3: "GBR", capital: "London", lat: 51.51, lon: -0.13 },
  US: { name: "United States", iso3: "USA", capital: "Washington, D.C.", lat: 38.9, lon: -77.04 },
  CA: { name: "Canada", iso3: "CAN", capital: "Ottawa", lat: 45.42, lon: -75.7 },
  AU: { name: "Australia", iso3: "AUS", capital: "Canberra", lat: -35.28, lon: 149.13 },
  AE: { name: "United Arab Emirates", iso3: "ARE", capital: "Abu Dhabi", lat: 24.45, lon: 54.38 },
  EE: { name: "Estonia", iso3: "EST", capital: "Tallinn", lat: 59.44, lon: 24.75 },
  PL: { name: "Poland", iso3: "POL", capital: "Warsaw", lat: 52.23, lon: 21.01 },
  MX: { name: "Mexico", iso3: "MEX", capital: "Mexico City", lat: 19.43, lon: -99.13 },
  TH: { name: "Thailand", iso3: "THA", capital: "Bangkok", lat: 13.76, lon: 100.5 },
  JP: { name: "Japan", iso3: "JPN", capital: "Tokyo", lat: 35.68, lon: 139.69 },
  SG: { name: "Singapore", iso3: "SGP", capital: "Singapore", lat: 1.35, lon: 103.82 },
  GR: { name: "Greece", iso3: "GRC", capital: "Athens", lat: 37.98, lon: 23.73 },
  CY: { name: "Cyprus", iso3: "CYP", capital: "Nicosia", lat: 35.19, lon: 33.38 },
  MT: { name: "Malta", iso3: "MLT", capital: "Valletta", lat: 35.9, lon: 14.51 },
  CH: { name: "Switzerland", iso3: "CHE", capital: "Bern", lat: 46.95, lon: 7.45 },
  AT: { name: "Austria", iso3: "AUT", capital: "Vienna", lat: 48.21, lon: 16.37 },
  CZ: { name: "Czechia", iso3: "CZE", capital: "Prague", lat: 50.08, lon: 14.44 },
  GE: { name: "Georgia", iso3: "GEO", capital: "Tbilisi", lat: 41.72, lon: 44.79 },
  AM: { name: "Armenia", iso3: "ARM", capital: "Yerevan", lat: 40.18, lon: 44.51 },
  TR: { name: "Turkey", iso3: "TUR", capital: "Ankara", lat: 39.93, lon: 32.86 },
  BR: { name: "Brazil", iso3: "BRA", capital: "Brasília", lat: -15.79, lon: -47.88 },
  AR: { name: "Argentina", iso3: "ARG", capital: "Buenos Aires", lat: -34.6, lon: -58.38 },
  UY: { name: "Uruguay", iso3: "URY", capital: "Montevideo", lat: -34.9, lon: -56.19 },
  CR: { name: "Costa Rica", iso3: "CRI", capital: "San José", lat: 9.93, lon: -84.08 },
  PA: { name: "Panama", iso3: "PAN", capital: "Panama City", lat: 8.98, lon: -79.52 },
  CO: { name: "Colombia", iso3: "COL", capital: "Bogotá", lat: 4.71, lon: -74.07 },
  MY: { name: "Malaysia", iso3: "MYS", capital: "Kuala Lumpur", lat: 3.14, lon: 101.69 },
  ID: { name: "Indonesia", iso3: "IDN", capital: "Jakarta", lat: -6.21, lon: 106.85 },
  VN: { name: "Vietnam", iso3: "VNM", capital: "Hanoi", lat: 21.03, lon: 105.85 },
  NZ: { name: "New Zealand", iso3: "NZL", capital: "Wellington", lat: -41.29, lon: 174.78 },
  RU: { name: "Russia", iso3: "RUS", capital: "Moscow", lat: 55.75, lon: 37.62 },
};

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "reloka-fetch" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
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

// Returns [{ name, iso2, iso3, capital, lat, lon }] for every officially
// assigned country with a capital, curated entries first (exact coords), then
// the rest of the world with geocoded capital coordinates.
export async function buildCountryCatalog({ geocode = true } = {}) {
  const all = await getJson(MLEDOZE);
  const out = [];
  const seen = new Set();

  for (const [iso2, c] of Object.entries(CURATED)) {
    out.push({ name: c.name, iso2, iso3: c.iso3, capital: c.capital, lat: c.lat, lon: c.lon });
    seen.add(iso2);
  }

  const rest = all.filter(
    (c) =>
      c.status === "officially-assigned" &&
      c.capital?.[0] &&
      c.cca2 &&
      !seen.has(c.cca2),
  );

  const CONCURRENCY = 8;
  let i = 0;
  async function worker() {
    while (i < rest.length) {
      const c = rest[i++];
      const capital = c.capital[0];
      const geo = geocode ? await geocodeCapital(capital, c.cca2) : null;
      out.push({
        name: c.name.common,
        iso2: c.cca2,
        iso3: c.cca3,
        capital,
        lat: geo?.lat ?? null,
        lon: geo?.lon ?? null,
      });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return out;
}
