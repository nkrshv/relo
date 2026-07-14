// Native travel-eSIM pricing for the destination, sourced from Saily's own
// partner API (https://web.saily.com/v3/partners/plans). Unlike the TUNE
// affiliate network (which exposes only a single generic Saily offer with no
// prices), this endpoint returns per-country plans with real prices, data
// allowances and a ready-to-use `destination_url` for building Tune deep
// links. We fetch on demand, cache in the shared Redis store for a day, and
// degrade gracefully (return null) whenever the API is unreachable or a
// country has no listed plan, so the checklist never breaks.

import { kvGetJson, kvSetJson } from "./ratelimit";

const PLANS_API = "https://web.saily.com/v3/partners/plans";
// The affiliate offer + id are ours, not secrets; overridable via env.
const OFFER_ID = process.env.SAILY_OFFER_ID ?? "101";
const AFF_ID = process.env.SAILY_AFF_ID ?? "15334";
const TRACK_HOST = "https://go.saily.site/aff_c";
const CACHE_TTL_SEC = 60 * 60 * 24; // 24h
const FETCH_TIMEOUT_MS = 6000;

export interface EsimPlan {
  name: string;
  /** Data allowance in whole GB (null when unlimited / unknown). */
  dataGb: number | null;
  /** Validity in days (null when unknown). */
  days: number | null;
  /** Plan price in the requested currency (USD). */
  priceUsd: number;
}

export interface EsimOffer {
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
  /** Best (lowest) price per GB across the country's data plans, USD. */
  pricePerGbUsd: number | null;
  /** A representative entry-level plan to show as a concrete example. */
  plan: EsimPlan | null;
  /** Percent-encoded Saily destination URL to feed into a Tune deep link. */
  destinationUrl: string | null;
  currency: string;
}

// Cached, currency/price-only shape (no per-user click id, so it is reusable).
type CachedOffer = Omit<EsimOffer, "country">;

interface RawPlan {
  identifier?: string;
  name?: string;
  is_unlimited?: boolean;
  duration?: { amount?: number; unit?: string } | null;
  data_limit?: { amount?: number; unit?: string } | null;
  covered_countries?: string[];
  destination_url?: string;
  price?: unknown;
}

interface RawResponse {
  items?: RawPlan[];
  total?: number;
}

// PartnersPrice shape is not fully documented here; with format_price=true the
// value is already in currency units. Pull a number out of the likely fields.
function readPrice(price: unknown): number | null {
  if (typeof price === "number" && Number.isFinite(price)) return price;
  if (price && typeof price === "object") {
    const p = price as Record<string, unknown>;
    for (const key of ["amount", "value", "final", "total", "price"]) {
      const v = p[key];
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)))
        return Number(v);
    }
  }
  return null;
}

function dataToGb(limit: RawPlan["data_limit"]): number | null {
  if (!limit || typeof limit.amount !== "number") return null;
  const unit = (limit.unit ?? "GB").toUpperCase();
  // Mobile data uses decimal (SI) units: 1 GB = 1000 MB, 1 TB = 1000 GB.
  if (unit === "MB") return limit.amount / 1000;
  if (unit === "TB") return limit.amount * 1000;
  return limit.amount; // assume GB
}

function daysOf(duration: RawPlan["duration"]): number | null {
  if (!duration || typeof duration.amount !== "number") return null;
  const unit = (duration.unit ?? "day").toLowerCase();
  if (unit.startsWith("week")) return duration.amount * 7;
  if (unit.startsWith("month")) return duration.amount * 30;
  return duration.amount; // assume days
}

async function fetchPlans(country: string): Promise<RawPlan[] | null> {
  const url =
    `${PLANS_API}?filters_in%5Bcovered_countries%5D=${encodeURIComponent(country)}` +
    `&format_price=true&currencyCode=USD&order=ASC&sortBy=data_limit.amount`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RawResponse;
    return Array.isArray(data.items) ? data.items : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function summarize(plans: RawPlan[], country: string): CachedOffer | null {
  interface Candidate {
    plan: EsimPlan;
    perGb: number;
    dataGb: number;
    destinationUrl: string | null;
  }
  const candidates: Candidate[] = [];
  let anyDestinationUrl: string | null = null;

  for (const raw of plans) {
    if (Array.isArray(raw.covered_countries) && raw.covered_countries.length > 0) {
      const covers = raw.covered_countries.some(
        (c) => c.toUpperCase() === country,
      );
      if (!covers) continue;
    }
    if (raw.destination_url && !anyDestinationUrl)
      anyDestinationUrl = raw.destination_url;
    if (raw.is_unlimited) continue;
    const priceUsd = readPrice(raw.price);
    const dataGb = dataToGb(raw.data_limit);
    if (priceUsd === null || priceUsd <= 0 || dataGb === null || dataGb <= 0)
      continue;
    candidates.push({
      plan: {
        name: (raw.name ?? "eSIM data plan").trim(),
        dataGb: Math.round(dataGb * 100) / 100,
        days: daysOf(raw.duration),
        priceUsd: Math.round(priceUsd * 100) / 100,
      },
      perGb: priceUsd / dataGb,
      dataGb,
      destinationUrl: raw.destination_url ?? null,
    });
  }

  if (candidates.length === 0) {
    if (!anyDestinationUrl) return null;
    return {
      pricePerGbUsd: null,
      plan: null,
      destinationUrl: anyDestinationUrl,
      currency: "USD",
    };
  }

  const bestPerGb = candidates.reduce((m, c) => Math.min(m, c.perGb), Infinity);
  // Representative = the smallest data plan (entry price a mover first sees).
  const representative = candidates.reduce((a, b) =>
    b.dataGb < a.dataGb ? b : a,
  );

  return {
    pricePerGbUsd: Math.round(bestPerGb * 100) / 100,
    plan: representative.plan,
    destinationUrl: representative.destinationUrl ?? anyDestinationUrl,
    currency: "USD",
  };
}

/**
 * Resolve the eSIM offer for a destination country (ISO alpha-2), cached for a
 * day. Returns null when the API is unreachable or nothing is listed.
 */
export async function getEsimOffer(country: string): Promise<EsimOffer | null> {
  const iso = country.toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso)) return null;

  const cacheKey = `relo:esim:${iso}`;
  const cached = await kvGetJson<CachedOffer>(cacheKey);
  if (cached) return { country: iso, ...cached };

  const plans = await fetchPlans(iso);
  if (!plans) return null;
  const offer = summarize(plans, iso);
  if (!offer) return null;

  await kvSetJson(cacheKey, offer, CACHE_TTL_SEC);
  return { country: iso, ...offer };
}

/**
 * Build the affiliate tracking (Tune) deep link. When `destinationUrl` is
 * given it is used as the raw `url=` value (Saily already percent-encodes it,
 * so it must NOT be re-encoded); otherwise the offer's default landing page is
 * used. `clickId` lets Tune attribute the click.
 */
export function buildTrackingUrl(opts?: {
  destinationUrl?: string | null;
  clickId?: string;
}): string {
  const params = [`offer_id=${OFFER_ID}`, `aff_id=${AFF_ID}`];
  if (opts?.clickId)
    params.push(`aff_click_id=${encodeURIComponent(opts.clickId)}`);
  if (opts?.destinationUrl) params.push(`url=${opts.destinationUrl}`);
  return `${TRACK_HOST}?${params.join("&")}`;
}
