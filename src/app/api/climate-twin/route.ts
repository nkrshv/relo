import type { NextRequest } from "next/server";
import { insightsForCountry } from "@/lib/countryInsights";
import {
  buildTwinComparison,
  type ClimatePoint,
  type ClimateTwin,
} from "@/lib/climateTwin";

// The "climate twin" endpoint: given the mover's home and destination
// (city + country), it resolves both to coordinates, pulls historical
// climate normals from Open-Meteo (temperature, rainfall, humidity; no key,
// CC BY 4.0) and the most recent PM2.5 from the nearest OpenAQ sensor
// (needs OPENAQ_API_KEY; degrades to null without it), then compares them.
// Results are cached in memory and at the CDN; everything degrades to null on
// failure so the client can simply hide the block.

export const runtime = "nodejs";

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
}

const cache = new Map<string, { at: number; data: ClimateTwin | null }>();
const TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 2000;

function cacheSet(key: string, data: ClimateTwin | null) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), data });
}

async function geocode(
  place: string,
  country: string,
): Promise<GeoResult | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=5&language=en&format=json`,
    { signal: AbortSignal.timeout(6000) },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: GeoResult[] };
  const results = json.results ?? [];
  if (results.length === 0) return null;
  const want = country.toLowerCase();
  return (
    results.find((r) => {
      const got = (r.country ?? "").toLowerCase();
      return got && (got.includes(want) || want.includes(got));
    }) ?? results[0]
  );
}

// Prefer the chosen city; fall back to the curated capital, then the country
// centroid, so a country-only move still gets a representative climate.
async function resolvePoint(
  city: string | undefined,
  country: string,
): Promise<{ geo: GeoResult; label: string } | null> {
  if (city) {
    const geo = await geocode(city, country).catch(() => null);
    if (geo) return { geo, label: geo.name };
  }
  const capital = insightsForCountry(country)?.climate.city;
  if (capital) {
    const geo = await geocode(capital, country).catch(() => null);
    if (geo) return { geo, label: geo.name };
  }
  const geo = await geocode(country, country).catch(() => null);
  if (geo) return { geo, label: country };
  return null;
}

interface ClimateNormals {
  janC: number | null;
  julC: number | null;
  coldestC: number | null;
  warmestC: number | null;
  coldestMonth: number | null;
  warmestMonth: number | null;
  wettestMonth: number | null;
  annualPrecipMm: number | null;
  humidityPct: number | null;
  year: number;
}

function mean(vals: number[]): number | null {
  const v = vals.filter((n): n is number => typeof n === "number");
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function sum(vals: number[]): number | null {
  const v = vals.filter((n): n is number => typeof n === "number");
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0);
}

async function fetchClimateNormals(
  lat: number,
  lon: number,
): Promise<ClimateNormals | null> {
  const year = new Date().getUTCFullYear() - 1;
  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
      `&start_date=${year}-01-01&end_date=${year}-12-31` +
      `&daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean&timezone=auto`,
    { signal: AbortSignal.timeout(9000) },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    daily?: {
      time?: string[];
      temperature_2m_mean?: (number | null)[];
      precipitation_sum?: (number | null)[];
      relative_humidity_2m_mean?: (number | null)[];
    };
  };
  const time = json.daily?.time ?? [];
  const temps = json.daily?.temperature_2m_mean ?? [];
  const precip = json.daily?.precipitation_sum ?? [];
  const humid = json.daily?.relative_humidity_2m_mean ?? [];
  if (time.length === 0) return null;

  const monthTemp: number[][] = Array.from({ length: 12 }, () => []);
  const monthPrecip: number[][] = Array.from({ length: 12 }, () => []);
  const monthHumid: number[][] = Array.from({ length: 12 }, () => []);
  time.forEach((t, i) => {
    const m = parseInt(t.slice(5, 7), 10) - 1;
    if (m < 0 || m > 11) return;
    if (typeof temps[i] === "number") monthTemp[m].push(temps[i] as number);
    if (typeof precip[i] === "number") monthPrecip[m].push(precip[i] as number);
    if (typeof humid[i] === "number") monthHumid[m].push(humid[i] as number);
  });

  const monthlyTempMean = monthTemp.map(mean);
  const monthlyPrecipSum = monthPrecip.map(sum);

  const withTemp = monthlyTempMean
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v !== null);
  if (withTemp.length === 0) return null;

  const coldest = withTemp.reduce((a, b) => (b.v < a.v ? b : a));
  const warmest = withTemp.reduce((a, b) => (b.v > a.v ? b : a));

  const withPrecip = monthlyPrecipSum
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v !== null);
  const wettest =
    withPrecip.length > 0
      ? withPrecip.reduce((a, b) => (b.v > a.v ? b : a))
      : null;

  const allHumid = monthHumid.flat();
  const allPrecip = precip.filter((n): n is number => typeof n === "number");

  return {
    janC: monthlyTempMean[0] !== null ? monthlyTempMean[0] : null,
    julC: monthlyTempMean[6] !== null ? monthlyTempMean[6] : null,
    coldestC: coldest.v,
    warmestC: warmest.v,
    coldestMonth: coldest.i + 1,
    warmestMonth: warmest.i + 1,
    wettestMonth: wettest ? wettest.i + 1 : null,
    annualPrecipMm: allPrecip.length > 0 ? sum(allPrecip) : null,
    humidityPct: allHumid.length > 0 ? mean(allHumid) : null,
    year,
  };
}

interface OpenAqLocation {
  id: number;
  name?: string;
  distance?: number;
  sensors?: { id: number; parameter?: { name?: string } }[];
}

// Most recent PM2.5 (µg/m³) from the OpenAQ sensor nearest the point. Picks
// the closest location that actually measures pm25, then reads its latest
// value. Returns null when no key is configured or no nearby sensor exists.
async function fetchPm25(
  lat: number,
  lon: number,
): Promise<{ pm25: number; station: string | null } | null> {
  const key = process.env.OPENAQ_API_KEY;
  if (!key) return null;
  const headers = { "X-API-Key": key };

  const locRes = await fetch(
    `https://api.openaq.org/v3/locations?coordinates=${lat},${lon}&radius=25000&limit=50`,
    { headers, signal: AbortSignal.timeout(7000) },
  );
  if (!locRes.ok) return null;
  const locJson = (await locRes.json()) as { results?: OpenAqLocation[] };
  const locations = (locJson.results ?? []).sort(
    (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
  );

  for (const loc of locations) {
    const pm25Sensor = loc.sensors?.find(
      (s) => s.parameter?.name === "pm25",
    );
    if (!pm25Sensor) continue;
    const latestRes = await fetch(
      `https://api.openaq.org/v3/locations/${loc.id}/latest`,
      { headers, signal: AbortSignal.timeout(7000) },
    ).catch(() => null);
    if (!latestRes || !latestRes.ok) continue;
    const latestJson = (await latestRes.json()) as {
      results?: { sensorsId?: number; value?: number }[];
    };
    const reading = latestJson.results?.find(
      (r) => r.sensorsId === pm25Sensor.id && typeof r.value === "number",
    );
    if (reading && typeof reading.value === "number" && reading.value >= 0) {
      return { pm25: reading.value, station: loc.name ?? null };
    }
  }
  return null;
}

async function buildPoint(
  city: string | undefined,
  country: string,
): Promise<ClimatePoint | null> {
  const resolved = await resolvePoint(city, country);
  if (!resolved) return null;
  const { geo, label } = resolved;
  const [normals, air] = await Promise.all([
    fetchClimateNormals(geo.latitude, geo.longitude).catch(() => null),
    fetchPm25(geo.latitude, geo.longitude).catch(() => null),
  ]);
  if (!normals) return null;
  return {
    label,
    janC: normals.janC !== null ? Math.round(normals.janC) : null,
    julC: normals.julC !== null ? Math.round(normals.julC) : null,
    coldestC: normals.coldestC !== null ? Math.round(normals.coldestC) : null,
    warmestC: normals.warmestC !== null ? Math.round(normals.warmestC) : null,
    coldestMonth: normals.coldestMonth,
    warmestMonth: normals.warmestMonth,
    wettestMonth: normals.wettestMonth,
    annualPrecipMm:
      normals.annualPrecipMm !== null
        ? Math.round(normals.annualPrecipMm)
        : null,
    humidityPct:
      normals.humidityPct !== null ? Math.round(normals.humidityPct) : null,
    pm25: air ? Math.round(air.pm25 * 10) / 10 : null,
    airStation: air?.station ?? null,
    year: normals.year,
  };
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const fromCountry = (p.get("fromCountry") ?? "").trim().slice(0, 80);
  const toCountry = (p.get("toCountry") ?? "").trim().slice(0, 80);
  const fromCity = (p.get("fromCity") ?? "").trim().slice(0, 80) || undefined;
  const toCity = (p.get("toCity") ?? "").trim().slice(0, 80) || undefined;
  if (!fromCountry || !toCountry) {
    return Response.json(
      { error: "fromCountry and toCountry are required" },
      { status: 400 },
    );
  }

  const key = [fromCountry, fromCity, toCountry, toCity]
    .map((s) => (s ?? "").toLowerCase())
    .join("|");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    if (!hit.data) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(hit.data, {
      headers: { "Cache-Control": "public, s-maxage=86400" },
    });
  }

  const [home, dest] = await Promise.all([
    buildPoint(fromCity, fromCountry).catch(() => null),
    buildPoint(toCity, toCountry).catch(() => null),
  ]);

  if (!home || !dest) {
    cacheSet(key, null);
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const { comfort, verdicts, packing } = buildTwinComparison(home, dest);
  const usedAir = home.pm25 !== null || dest.pm25 !== null;
  const data: ClimateTwin = {
    home,
    dest,
    comfort,
    verdicts,
    packing,
    sources: ["Open-Meteo (CC BY 4.0)", ...(usedAir ? ["OpenAQ"] : [])],
  };
  cacheSet(key, data);
  return Response.json(data, {
    headers: { "Cache-Control": "public, s-maxage=86400" },
  });
}
