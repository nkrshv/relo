import type { NextRequest } from "next/server";
import { insightsForCountry } from "@/lib/countryInsights";
import {
  buildTwinComparison,
  type ClimatePoint,
  type ClimateTwin,
  type Pollutant,
} from "@/lib/climateTwin";

// The "climate twin" endpoint: given the mover's home and destination
// (city + country), it resolves both to coordinates, pulls historical
// climate normals from Open-Meteo (temperature, rainfall, humidity; no key,
// CC BY 4.0) and annual pollutant averages (PM2.5, PM10, NO2, O3, SO2, CO)
// from the nearest OpenAQ sensors (needs OPENAQ_API_KEY; degrades to [] with-
// out it), compares them, and asks OpenAI for a short grounded verdict.
// Results are cached in memory and at the CDN; everything degrades so the
// client can simply hide the block.

export const runtime = "nodejs";

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
}

const cache = new Map<string, { at: number; data: ClimateTwin | null }>();
const TTL_MS = 24 * 60 * 60 * 1000;
// A miss (upstream timeout / transient failure) must not stick: cache it only
// briefly so the next view retries the live sources instead of showing "no
// data" for a whole day.
const NEG_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 2000;

function cacheSet(key: string, data: ClimateTwin | null) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), data });
}

function cacheFresh(hit: { at: number; data: ClimateTwin | null }): boolean {
  const ttl = hit.data ? TTL_MS : NEG_TTL_MS;
  return Date.now() - hit.at < ttl;
}

// One retry for the external climate/geo sources: they occasionally time out
// or 5xx transiently, and a single retry turns most of those misses into hits
// instead of poisoning the cache. Only retries transport errors and 5xx, not
// 4xx (which are genuine "no such place").
async function fetchResilient(
  url: string,
  init: RequestInit,
): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || (res.status >= 400 && res.status < 500)) return res;
    } catch {
      // transport error / timeout: fall through to retry
    }
  }
  return null;
}

// Outcomes are three-way so the caller can tell a genuine "no such place"
// (safe to cache and hide) apart from a transient upstream failure (must be
// retryable, never cached as "no data").
type GeoOutcome =
  | { status: "ok"; geo: GeoResult }
  | { status: "empty" }
  | { status: "unavailable" };

async function geocode(place: string, country: string): Promise<GeoOutcome> {
  const res = await fetchResilient(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=5&language=en&format=json`,
    { signal: AbortSignal.timeout(6000) },
  );
  if (!res) return { status: "unavailable" };
  if (!res.ok) return { status: "empty" };
  const json = (await res.json().catch(() => null)) as {
    results?: GeoResult[];
  } | null;
  const results = json?.results ?? [];
  if (results.length === 0) return { status: "empty" };
  const want = country.toLowerCase();
  const geo =
    results.find((r) => {
      const got = (r.country ?? "").toLowerCase();
      return got && (got.includes(want) || want.includes(got));
    }) ?? results[0];
  return { status: "ok", geo };
}

type ResolveOutcome =
  | { status: "ok"; geo: GeoResult; label: string }
  | { status: "empty" }
  | { status: "unavailable" };

// Prefer the chosen city; fall back to the curated capital, then the country
// centroid, so a country-only move still gets a representative climate. If any
// step hit a transient failure but none genuinely resolved, report
// "unavailable" (retryable) rather than "empty" (genuinely nothing there).
async function resolvePoint(
  city: string | undefined,
  country: string,
): Promise<ResolveOutcome> {
  let sawUnavailable = false;
  const attempt = async (place: string, label: string) => {
    const r = await geocode(place, country).catch(
      () => ({ status: "unavailable" }) as GeoOutcome,
    );
    if (r.status === "unavailable") sawUnavailable = true;
    return r.status === "ok"
      ? ({ status: "ok", geo: r.geo, label } as const)
      : null;
  };

  if (city) {
    const geo = await attempt(city, city);
    if (geo) return { ...geo, label: geo.label };
  }
  const capital = insightsForCountry(country)?.climate.city;
  if (capital) {
    const hit = await attempt(capital, capital);
    if (hit) return hit;
  }
  const hit = await attempt(country, country);
  if (hit) return hit;
  return { status: sawUnavailable ? "unavailable" : "empty" };
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
  sunnyDays: number | null;
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
  const res = await fetchResilient(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
      `&start_date=${year}-01-01&end_date=${year}-12-31` +
      `&daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean,sunshine_duration&timezone=auto`,
    { signal: AbortSignal.timeout(9000) },
  );
  if (!res || !res.ok) return null;
  const json = (await res.json()) as {
    daily?: {
      time?: string[];
      temperature_2m_mean?: (number | null)[];
      precipitation_sum?: (number | null)[];
      relative_humidity_2m_mean?: (number | null)[];
      sunshine_duration?: (number | null)[];
    };
  };
  const time = json.daily?.time ?? [];
  const temps = json.daily?.temperature_2m_mean ?? [];
  const precip = json.daily?.precipitation_sum ?? [];
  const humid = json.daily?.relative_humidity_2m_mean ?? [];
  const sunshine = json.daily?.sunshine_duration ?? [];
  if (time.length === 0) return null;

  // A "sunny day" gets more than 4.5 hours of sunshine (16,200 seconds).
  // Only trust the count when the year is reasonably complete, so a partial
  // response cannot pass off missing days as cloudy ones.
  const sunReadings = sunshine.filter(
    (s): s is number => typeof s === "number",
  );
  const sunnyDays =
    sunReadings.length >= 300
      ? sunReadings.filter((s) => s > 4.5 * 3600).length
      : null;

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
    sunnyDays,
    year,
  };
}

interface OpenAqSensor {
  id: number;
  parameter?: { name?: string; units?: string; displayName?: string };
}

interface OpenAqLocation {
  id: number;
  name?: string;
  distance?: number;
  sensors?: OpenAqSensor[];
}

// Pollutants we surface, in display order. Labels/units come from the API
// response so we stay faithful to what each sensor actually reports.
const POLLUTANTS = ["pm25", "pm10", "no2", "o3", "so2", "co"] as const;
// Unit-aware rounding: µg/m³ values are whole-ish, but ppm/ppb readings can be
// well below 1, where rounding to a single decimal would wrongly show "0".
function roundSmart(v: number): number {
  if (v >= 10) return Math.round(v);
  if (v >= 1) return Math.round(v * 10) / 10;
  if (v <= 0) return 0;
  const digits = Math.max(0, 2 - Math.floor(Math.log10(v)));
  const f = Math.pow(10, digits);
  return Math.round(v * f) / f;
}

const POLLUTANT_LABEL: Record<string, string> = {
  pm25: "PM2.5",
  pm10: "PM10",
  no2: "NO2",
  o3: "O3",
  so2: "SO2",
  co: "CO",
};

// Annual pollutant averages from the OpenAQ sensors nearest the point. For
// each pollutant it takes the closest station (government or community) that
// measures it, then reads the yearly mean for the reference year (falling
// back to the most recent year with decent coverage). Returns [] when no key
// is set or no nearby sensor has usable data.
async function fetchAir(
  lat: number,
  lon: number,
  refYear: number,
): Promise<Pollutant[]> {
  const key = process.env.OPENAQ_API_KEY;
  if (!key) return [];
  const headers = { "X-API-Key": key };

  const locRes = await fetch(
    `https://api.openaq.org/v3/locations?coordinates=${lat},${lon}&radius=25000&limit=100`,
    { headers, signal: AbortSignal.timeout(8000) },
  ).catch(() => null);
  if (!locRes || !locRes.ok) return [];
  const locJson = (await locRes.json()) as { results?: OpenAqLocation[] };
  const locations = (locJson.results ?? []).sort(
    (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
  );

  // Pick the nearest sensor per pollutant.
  const chosen = new Map<
    string,
    { sensorId: number; station: string | null }
  >();
  for (const loc of locations) {
    for (const sensor of loc.sensors ?? []) {
      const name = sensor.parameter?.name;
      if (!name || !POLLUTANTS.includes(name as (typeof POLLUTANTS)[number]))
        continue;
      if (!chosen.has(name)) {
        chosen.set(name, { sensorId: sensor.id, station: loc.name ?? null });
      }
    }
    if (chosen.size === POLLUTANTS.length) break;
  }

  const results = await Promise.all(
    [...chosen.entries()].map(([name, { sensorId, station }]) =>
      fetchSensorYear(headers, sensorId, refYear).then((y) => {
        if (!y) return null;
        const value = roundSmart(y.value);
        if (value <= 0) return null; // rounds away to nothing; not worth showing
        return {
          parameter: name,
          label: POLLUTANT_LABEL[name] ?? name.toUpperCase(),
          value,
          unit: y.unit,
          year: y.year,
          station,
        };
      }),
    ),
  );

  const air = results.filter((r): r is Pollutant => r !== null);
  air.sort(
    (a, b) => POLLUTANTS.indexOf(a.parameter as (typeof POLLUTANTS)[number]) -
      POLLUTANTS.indexOf(b.parameter as (typeof POLLUTANTS)[number]),
  );
  return air;
}

interface YearlyResult {
  value?: number;
  parameter?: { units?: string };
  period?: { datetimeFrom?: { utc?: string } };
  coverage?: { percentComplete?: number };
}

// Yearly mean for one sensor: prefers the reference year, else the most recent
// year with at least ~40% coverage.
async function fetchSensorYear(
  headers: Record<string, string>,
  sensorId: number,
  refYear: number,
): Promise<{ value: number; unit: string; year: number } | null> {
  const res = await fetch(
    `https://api.openaq.org/v3/sensors/${sensorId}/years` +
      `?date_from=${refYear - 2}-01-01&date_to=${refYear}-12-31&limit=5`,
    { headers, signal: AbortSignal.timeout(7000) },
  ).catch(() => null);
  if (!res || !res.ok) return null;
  const json = (await res.json()) as { results?: YearlyResult[] };
  const usable = (json.results ?? [])
    .map((r) => ({
      value: r.value,
      unit: r.parameter?.units ?? "µg/m³",
      year: parseInt(r.period?.datetimeFrom?.utc?.slice(0, 4) ?? "0", 10),
      coverage: r.coverage?.percentComplete ?? 0,
    }))
    .filter(
      (r) => typeof r.value === "number" && r.value >= 0 && r.coverage >= 40,
    ) as { value: number; unit: string; year: number; coverage: number }[];
  if (usable.length === 0) return null;
  const exact = usable.find((r) => r.year === refYear);
  const best = exact ?? usable.sort((a, b) => b.year - a.year)[0];
  return { value: best.value, unit: best.unit, year: best.year };
}

type PointOutcome =
  | { status: "ok"; point: ClimatePoint }
  | { status: "empty" }
  | { status: "unavailable" };

async function buildPoint(
  city: string | undefined,
  country: string,
): Promise<PointOutcome> {
  const resolved = await resolvePoint(city, country);
  if (resolved.status !== "ok") return { status: resolved.status };
  const { geo, label } = resolved;
  const refYear = new Date().getUTCFullYear() - 1;
  const [normals, air] = await Promise.all([
    fetchClimateNormals(geo.latitude, geo.longitude).catch(() => null),
    fetchAir(geo.latitude, geo.longitude, refYear).catch(() => []),
  ]);
  // Geocoded fine but the climate archive gave nothing: treat as a transient
  // miss so it stays retryable rather than being cached as "no climate".
  if (!normals) return { status: "unavailable" };
  const point: ClimatePoint = {
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
    sunnyDays: normals.sunnyDays,
    air,
    year: normals.year,
  };
  return { status: "ok", point };
}

// A short, plain-language read tying the numbers together, generated by the
// model but strictly grounded: it is only fed the verified facts and told not
// to invent, advise medically, or use em dashes. Falls back to null on any
// failure so the deterministic verdicts still carry the block.
const COMFORT_GUIDANCE: Record<string, string> = {
  similar:
    "the computed verdict is that the climate is broadly SIMILAR to home, so reassure them it will feel familiar",
  milder:
    "the computed verdict is that the destination is MILDER overall than home",
  harsher:
    "the computed verdict is that the destination is HARSHER overall than home",
  mixed:
    "the computed verdict is that the climate is a REAL CHANGE from home (notably different)",
};

async function aiSummary(
  home: ClimatePoint,
  dest: ClimatePoint,
  verdicts: string[],
  comfort: string,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const facts = {
    home: pointFacts(home),
    destination: pointFacts(dest),
    computedComparisons: verdicts,
    overallVerdict: comfort,
  };
  const prompt =
    "You are helping someone relocate understand how the destination's climate and air " +
    "quality compare to their home city, so they feel less anxious about the move. " +
    "Using ONLY the verified facts below, write 2 to 3 short sentences in plain English. " +
    "First, describe how physically comfortable the destination is likely to feel relative " +
    "to home (temperature, rain, humidity, sunshine, air quality). When both places have a " +
    "sunny day count, mention how many more or fewer sunny days the destination gets. " +
    `Then add ONE clear sentence assessing the overall climate fit: ${COMFORT_GUIDANCE[comfort] ?? COMFORT_GUIDANCE.similar}. ` +
    "Say plainly whether they should expect roughly the same climate as home or prepare for a " +
    "real adjustment, and name the single biggest thing to get used to. Be specific and honest. " +
    "Do not invent numbers, do not give medical advice, do not guarantee comfort, and do not use em dashes. " +
    "Return JSON: {\"summary\": string}.\n\nFacts:\n" +
    JSON.stringify(facts);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as { summary?: unknown };
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    return summary.replace(/\u2014/g, ", ").slice(0, 600) || null;
  } catch {
    return null;
  }
}

function pointFacts(p: ClimatePoint) {
  return {
    place: p.label,
    year: p.year,
    coldestMonthMeanC: p.coldestC,
    warmestMonthMeanC: p.warmestC,
    janMeanC: p.janC,
    julMeanC: p.julC,
    annualRainMm: p.annualPrecipMm,
    meanHumidityPct: p.humidityPct,
    sunnyDaysOver4p5hSun: p.sunnyDays,
    airAnnualAverages: p.air.map((a) => ({
      pollutant: a.label,
      value: a.value,
      unit: a.unit,
    })),
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
  if (hit && cacheFresh(hit)) {
    if (!hit.data) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(hit.data, {
      headers: { "Cache-Control": "public, s-maxage=86400" },
    });
  }

  const [home, dest] = await Promise.all([
    buildPoint(fromCity, fromCountry).catch(
      () => ({ status: "unavailable" }) as PointOutcome,
    ),
    buildPoint(toCity, toCountry).catch(
      () => ({ status: "unavailable" }) as PointOutcome,
    ),
  ]);

  if (home.status !== "ok" || dest.status !== "ok") {
    // A transient failure on either side must stay retryable: return 503 and
    // do NOT cache, so the next view (or the client's retry) hits the sources
    // again. Only a genuine "no such place" is cached (briefly) and 404'd.
    const transient =
      home.status === "unavailable" || dest.status === "unavailable";
    if (transient) {
      return Response.json(
        { error: "temporarily unavailable" },
        { status: 503 },
      );
    }
    cacheSet(key, null);
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const homePoint = home.point;
  const destPoint = dest.point;
  const { comfort, verdicts, packing } = buildTwinComparison(
    homePoint,
    destPoint,
  );
  const usedAir = homePoint.air.length > 0 || destPoint.air.length > 0;
  const summary = await aiSummary(homePoint, destPoint, verdicts, comfort).catch(
    () => null,
  );
  const data: ClimateTwin = {
    home: homePoint,
    dest: destPoint,
    comfort,
    verdicts,
    packing,
    aiSummary: summary,
    sources: ["Open-Meteo (CC BY 4.0)", ...(usedAir ? ["OpenAQ"] : [])],
  };
  cacheSet(key, data);
  return Response.json(data, {
    headers: { "Cache-Control": "public, s-maxage=86400" },
  });
}
