// Ballpark nightly hotel price for a destination city, used only as an
// orientation hint on the temporary-accommodation task ("expect roughly EUR X
// a night for your first weeks"). Prices come from the Hotels.nl search API
// (https://hotels.nl/api/search.php), which returns the cheapest rate per hotel
// for up to 15 hotels near a location. We take the MEDIAN nightly price across
// those hotels as a typical budget figure, cache it per city in the shared
// Redis store for a week (prices here are a rough guide, not a live quote), and
// degrade gracefully (return null) whenever the API is unreachable, rate-limited
// or the key is missing, so the checklist never breaks. The affiliate booking
// link points at Klook, not Hotels.nl: the price is a neutral average, the
// booking link is our partner.

import { kvGetJson, kvSetJson } from "./ratelimit";
import { openDataForCountry } from "./countryOpenData";

const SEARCH_API = "https://hotels.nl/api/search.php";
const CACHE_TTL_SEC = 60 * 60 * 24 * 7; // 7 days
const FETCH_TIMEOUT_MS = 8000;
const NIGHTS = 3;

// Klook hotels referral link (tracking baked in; not a secret, env-overridable).
const KLOOK_URL = process.env.KLOOK_AFF_URL ?? "https://klook.tpk.ro/oNqNkb6K";

export interface HotelPriceEstimate {
  /** Typical (median) nightly price across nearby hotels, rounded. */
  medianPerNight: number;
  /** Cheapest nightly price seen, rounded. */
  minPerNight: number;
  currency: string;
}

interface RawRate {
  pricing?: { total_price?: unknown; currency?: unknown };
}
interface RawHotel {
  rate?: RawRate;
}
interface RawResponse {
  hotels?: RawHotel[];
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// A future check-in/out window (~30 days out, 3 nights) so the API always has
// bookable dates; the exact dates do not matter for a ballpark figure.
function searchWindow(): { checkin: string; checkout: string } {
  const start = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + NIGHTS * 24 * 60 * 60 * 1000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { checkin: iso(start), checkout: iso(end) };
}

async function fetchEstimate(
  location: string,
): Promise<HotelPriceEstimate | null> {
  const apikey = process.env.HOTELS_NL_API_KEY;
  if (!apikey) return null;
  const { checkin, checkout } = searchWindow();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(SEARCH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey,
        location,
        checkin,
        checkout,
        persons: 2,
        currency: "EUR",
        include_amenities: false,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RawResponse;
    const hotels = Array.isArray(data.hotels) ? data.hotels : [];
    const perNight: number[] = [];
    let currency = "EUR";
    for (const h of hotels) {
      const tp = h.rate?.pricing?.total_price;
      const price =
        typeof tp === "number"
          ? tp
          : typeof tp === "string" && tp.trim() !== ""
            ? Number(tp)
            : NaN;
      if (!Number.isFinite(price) || price <= 0) continue;
      perNight.push(price / NIGHTS);
      if (typeof h.rate?.pricing?.currency === "string")
        currency = h.rate.pricing.currency;
    }
    if (perNight.length === 0) return null;
    return {
      medianPerNight: Math.round(median(perNight)),
      minPerNight: Math.round(Math.min(...perNight)),
      currency,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ballpark nightly hotel price for the destination city (falling back to the
 * country capital when no city is given), cached per location for a week.
 * Returns null when the API is unavailable or nothing is listed.
 */
export async function getHotelNightlyEstimate(
  toCity: string | undefined,
  toCountry: string,
): Promise<HotelPriceEstimate | null> {
  const capital = openDataForCountry(toCountry)?.capital ?? null;
  const place = toCity && toCity.trim() ? toCity.trim() : capital;
  if (!place) return null;
  const location = `${place}, ${toCountry}`;

  const cacheKey = `relo:hotelpn:${norm(location)}`;
  const cached = await kvGetJson<HotelPriceEstimate>(cacheKey);
  if (cached) return cached;

  const estimate = await fetchEstimate(location);
  if (!estimate) return null;

  await kvSetJson(cacheKey, estimate, CACHE_TTL_SEC);
  return estimate;
}

/** Klook hotels referral/affiliate link (env-overridable). */
export function klookAffiliateUrl(): string {
  return KLOOK_URL;
}
