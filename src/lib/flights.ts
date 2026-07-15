// Native flight-price hint for the "before you go" phase, sourced from the
// Travelpayouts / Aviasales Data API. Given the mover's origin and destination
// (city when provided, otherwise the destination/origin country capital), we
// resolve each side to an IATA city code, then fetch the cheapest currently
// cached one-way fare and surface it as "Flights from ~$X" with an affiliate
// deep link to the international aviasales.com search. Everything runs
// server-side (the API token never reaches the client), results are cached in
// the shared Redis store for a day, and every failure degrades gracefully:
// when a code can't be resolved or the cache is empty we return a route search
// link without a price, and when nothing is resolvable we return null so the
// checklist item is left untouched.

import { kvGetJson, kvSetJson } from "./ratelimit";
import { openDataForCountry } from "./countryOpenData";

const PRICES_API = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";
const AUTOCOMPLETE_API = "https://autocomplete.travelpayouts.com/places2";
// International (English) Aviasales site; the Data API `link` field is relative
// to this host. Non-RU users land here, not on aviasales.ru.
const AVIASALES_HOST = "https://www.aviasales.com";
// Public affiliate marker (a tracking id, not a secret); overridable via env.
const MARKER = process.env.AVIASALES_MARKER ?? "319650";
const TOKEN = process.env.TRAVELPAYOUTS_API_TOKEN ?? "";
const CURRENCY = "usd";
const CACHE_TTL_SEC = 60 * 60 * 24; // 24h
const IATA_CACHE_TTL_SEC = 60 * 60 * 24 * 30; // city -> IATA rarely changes
const FETCH_TIMEOUT_MS = 6000;

export interface FlightOffer {
  /** Lowest currently cached one-way fare, in USD (null when none found). */
  priceUsd: number | null;
  /** Affiliate deep link to the aviasales.com search for this route. */
  url: string;
  /** Resolved IATA city codes actually used. */
  originIata: string;
  destinationIata: string;
}

interface RawPrice {
  price?: number;
  link?: string;
}

interface RawPriceResponse {
  success?: boolean;
  data?: RawPrice[];
}

interface RawPlace {
  code?: string;
  type?: string;
  country_name?: string;
}

async function fetchJson<T>(url: string, headers?: Record<string, string>): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...headers },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Resolve a free-text city (validated against its country) to an IATA city
// code via the Travelpayouts autocomplete. Prefers a city-type match whose
// country matches the plan; falls back to the first city result.
async function resolveIata(city: string, country: string): Promise<string | null> {
  const key = `relo:iata:${norm(city)}|${norm(country)}`;
  const cached = await kvGetJson<string | null>(key);
  if (cached !== null) return cached || null;

  const url = `${AUTOCOMPLETE_API}?locale=en&types%5B%5D=city&term=${encodeURIComponent(
    city,
  )}`;
  const places = await fetchJson<RawPlace[]>(url);
  let code: string | null = null;
  if (Array.isArray(places)) {
    const cities = places.filter((p) => p.type === "city" && p.code);
    const wantCountry = norm(country);
    const matched =
      cities.find((p) => p.country_name && norm(p.country_name) === wantCountry) ??
      cities[0];
    code = matched?.code ?? null;
  }
  // Cache the empty result too (short-circuits repeated misses), stored as "".
  await kvSetJson(key, code ?? "", IATA_CACHE_TTL_SEC);
  return code;
}

// City to use for a side of the trip: the explicit city, else the country
// capital from our open-data snapshot.
function cityFor(city: string | undefined, country: string): string | null {
  if (city && city.trim()) return city.trim();
  return openDataForCountry(country)?.capital ?? null;
}

function buildSearchUrl(originIata: string, destinationIata: string, link?: string): string {
  if (link) {
    const sep = link.includes("?") ? "&" : "?";
    return `${AVIASALES_HOST}${link}${sep}marker=${MARKER}`;
  }
  // Route-level fallback search (no specific fare/date).
  return `${AVIASALES_HOST}/search/${originIata}${destinationIata}1?marker=${MARKER}`;
}

export interface FlightQuery {
  fromCity?: string;
  fromCountry: string;
  toCity?: string;
  toCountry: string;
}

export async function getFlightOffer(q: FlightQuery): Promise<FlightOffer | null> {
  const originCity = cityFor(q.fromCity, q.fromCountry);
  const destCity = cityFor(q.toCity, q.toCountry);
  if (!originCity || !destCity) return null;

  const [originIata, destinationIata] = await Promise.all([
    resolveIata(originCity, q.fromCountry),
    resolveIata(destCity, q.toCountry),
  ]);
  if (!originIata || !destinationIata || originIata === destinationIata) return null;

  const priceKey = `relo:flight:${originIata}-${destinationIata}`;
  const cached = await kvGetJson<FlightOffer>(priceKey);
  if (cached) return cached;

  let priceUsd: number | null = null;
  let link: string | undefined;
  if (TOKEN) {
    const url = `${PRICES_API}?origin=${originIata}&destination=${destinationIata}&currency=${CURRENCY}&one_way=true&sorting=price&direct=false&limit=1&token=${TOKEN}`;
    const res = await fetchJson<RawPriceResponse>(url);
    const best = res?.success && Array.isArray(res.data) ? res.data[0] : undefined;
    if (best && typeof best.price === "number" && best.price > 0) {
      priceUsd = Math.round(best.price);
      link = best.link;
    }
  }

  const offer: FlightOffer = {
    priceUsd,
    url: buildSearchUrl(originIata, destinationIata, link),
    originIata,
    destinationIata,
  };
  await kvSetJson(priceKey, offer, CACHE_TTL_SEC);
  return offer;
}
