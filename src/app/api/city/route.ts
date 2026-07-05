import type { NextRequest } from "next/server";

// City-level context for big countries where capital data misleads
// (India, Australia, ...). Geocodes the city via Open-Meteo (free, no key),
// then resolves its timezone offset, air quality (WAQI, server-side token)
// and Jan/Jul mean temperatures from the ERA5 archive. Results are cached
// in memory and at the CDN; everything degrades to null on failure so the
// client can fall back to capital-level snapshot data.

export interface CityContext {
  city: string;
  country: string | null;
  timezone: string | null;
  offsetHours: number | null;
  aqi: number | null;
  station: string | null;
  janC: number | null;
  julC: number | null;
  climateYear: number | null;
}

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  timezone?: string;
  population?: number;
}

const cache = new Map<string, { at: number; data: CityContext | null }>();
const TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 2000;

function cacheSet(key: string, data: CityContext | null) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), data });
}

function offsetHoursFor(tz: string): number | null {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
    if (!part) return null;
    if (part === "GMT" || part === "UTC") return 0;
    const m = part.match(/GMT([+-]\d+)(?::(\d+))?/);
    if (!m) return null;
    const hours = parseInt(m[1], 10);
    const minutes = m[2] ? parseInt(m[2], 10) : 0;
    return hours + Math.sign(hours) * (minutes / 60);
  } catch {
    return null;
  }
}

async function geocode(
  city: string,
  country: string,
): Promise<GeoResult | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`,
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

interface WaqiFeed {
  status?: string;
  data?: {
    aqi?: number | string;
    city?: { name?: string; geo?: [number, number] };
  };
}

function kmBetween(aLat: number, aLon: number, bLat: number, bLon: number) {
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(s));
}

// The WAQI geo feed sometimes returns a far-away station (e.g. Delhi for
// Mumbai coordinates), so try the city-name feed first and only accept a
// geo-feed result whose station is plausibly near the requested point.
async function fetchAqi(
  city: string,
  lat: number,
  lon: number,
): Promise<{ aqi: number; station: string | null } | null> {
  const token = process.env.WAQI_TOKEN;
  if (!token) return null;
  const feed = async (path: string): Promise<WaqiFeed | null> => {
    const res = await fetch(`https://api.waqi.info/feed/${path}/?token=${token}`, {
      signal: AbortSignal.timeout(6000),
    });
    return res.ok ? ((await res.json()) as WaqiFeed) : null;
  };
  const byName = await feed(encodeURIComponent(city.toLowerCase())).catch(
    () => null,
  );
  if (byName?.status === "ok" && typeof byName.data?.aqi === "number") {
    return { aqi: byName.data.aqi, station: byName.data.city?.name ?? null };
  }
  const byGeo = await feed(`geo:${lat};${lon}`).catch(() => null);
  if (byGeo?.status === "ok" && typeof byGeo.data?.aqi === "number") {
    const geo = byGeo.data.city?.geo;
    if (geo && kmBetween(lat, lon, geo[0], geo[1]) > 150) return null;
    return { aqi: byGeo.data.aqi, station: byGeo.data.city?.name ?? null };
  }
  return null;
}

async function fetchClimate(
  lat: number,
  lon: number,
): Promise<{ janC: number; julC: number; year: number } | null> {
  const year = new Date().getUTCFullYear() - 1;
  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${year}-01-01&end_date=${year}-12-31&daily=temperature_2m_mean&timezone=auto`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    daily?: { time?: string[]; temperature_2m_mean?: (number | null)[] };
  };
  const time = json.daily?.time ?? [];
  const temps = json.daily?.temperature_2m_mean ?? [];
  const monthly = (month: string): number | null => {
    const vals = time
      .map((t, i) => (t.slice(5, 7) === month ? temps[i] : null))
      .filter((v): v is number => typeof v === "number");
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  const janC = monthly("01");
  const julC = monthly("07");
  if (janC === null || julC === null) return null;
  return { janC, julC, year };
}

export async function GET(req: NextRequest) {
  const city = (req.nextUrl.searchParams.get("city") ?? "").trim().slice(0, 80);
  const country = (req.nextUrl.searchParams.get("country") ?? "")
    .trim()
    .slice(0, 80);
  if (!city || !country) {
    return Response.json(
      { error: "city and country are required" },
      { status: 400 },
    );
  }

  const key = `${country.toLowerCase()}:${city.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    if (!hit.data) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(hit.data, {
      headers: { "Cache-Control": "public, s-maxage=21600" },
    });
  }

  let geo: GeoResult | null = null;
  try {
    geo = await geocode(city, country);
  } catch {
    // treated as not found below
  }
  if (!geo) {
    cacheSet(key, null);
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const [aqi, climate] = await Promise.all([
    fetchAqi(geo.name, geo.latitude, geo.longitude).catch(() => null),
    fetchClimate(geo.latitude, geo.longitude).catch(() => null),
  ]);

  const data: CityContext = {
    city: geo.name,
    country: geo.country ?? null,
    timezone: geo.timezone ?? null,
    offsetHours: geo.timezone ? offsetHoursFor(geo.timezone) : null,
    aqi: aqi?.aqi ?? null,
    station: aqi?.station ?? null,
    janC: climate ? Math.round(climate.janC) : null,
    julC: climate ? Math.round(climate.julC) : null,
    climateYear: climate?.year ?? null,
  };
  cacheSet(key, data);
  return Response.json(data, {
    headers: { "Cache-Control": "public, s-maxage=21600" },
  });
}
