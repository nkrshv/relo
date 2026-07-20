// Real-time nomad health-insurance pricing from Genki's public MCP server
// (https://api.genki.world/mcp). Genki sells worldwide travel/expat health
// insurance aimed at digital nomads; its MCP exposes a `list_product_prices`
// tool that returns real monthly prices for a given age. We call it over plain
// JSON-RPC (the server answers with application/json, no SSE needed), cache the
// per-age result in the shared Redis store for a day, and degrade gracefully
// (return null) whenever the server is unreachable or the age is out of range,
// so the checklist never breaks. This powers a partner (affiliate) offer shown
// only on nomad plans, in the same style as the eSIM providers.

import { kvGetJson, kvSetJson } from "./ratelimit";

const MCP_URL = "https://api.genki.world/mcp";
// Genki Traveler is the worldwide travel-health product for nomads (monthly,
// cancellable, ages up to 69). Genki Native is long-term expat cover.
const PRODUCT_NAME = "Genki Traveler";
const MAX_AGE = 69;
const CACHE_TTL_SEC = 60 * 60 * 24; // 24h
const FETCH_TIMEOUT_MS = 6000;

// Genki referral/affiliate landing link. Not a secret; overridable via env so
// the real partner tracking URL can be set without a code change.
const AFF_URL = process.env.GENKI_AFF_URL ?? "https://genki.world/";

export interface GenkiOffer {
  /** Cheapest monthly price across configurations, in `currency` units. */
  priceFrom: number;
  currency: string;
  /** Age the quote was calculated for. */
  age: number;
  /** Affiliate landing/referral URL. */
  url: string;
}

interface Configuration {
  totalPrice?: string;
}

interface PriceResult {
  configurations?: Configuration[];
}

// "EUR123.60 per month" -> { currency: "EUR", amount: 123.6 }
function parsePrice(text: string): { currency: string; amount: number } | null {
  const m = text.match(/([A-Z]{3})\s*([\d.,]+)/);
  if (!m) return null;
  const amount = Number(m[2].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { currency: m[1], amount };
}

async function callPrices(age: number): Promise<PriceResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "list_product_prices",
          arguments: { productName: PRODUCT_NAME, personAges: [age] },
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: { isError?: boolean; content?: Array<{ text?: string }> };
    };
    const result = data.result;
    if (!result || result.isError) return null;
    const text = result.content?.[0]?.text;
    if (typeof text !== "string") return null;
    return JSON.parse(text) as PriceResult;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve the cheapest monthly Genki Traveler price for a mover of the given
 * age, cached for a day. Returns null when age is out of range, unknown, or the
 * MCP server is unreachable.
 */
export async function getGenkiOffer(age?: number): Promise<GenkiOffer | null> {
  if (typeof age !== "number" || !Number.isFinite(age)) return null;
  const a = Math.round(age);
  if (a < 0 || a > MAX_AGE) return null;

  const cacheKey = `relo:genki:traveler:${a}`;
  const cached = await kvGetJson<Omit<GenkiOffer, "url">>(cacheKey);
  if (cached) return { ...cached, url: AFF_URL };

  const result = await callPrices(a);
  const configs = result?.configurations ?? [];
  let best: { currency: string; amount: number } | null = null;
  for (const cfg of configs) {
    if (typeof cfg.totalPrice !== "string") continue;
    const parsed = parsePrice(cfg.totalPrice);
    if (!parsed) continue;
    if (!best || parsed.amount < best.amount) best = parsed;
  }
  if (!best) return null;

  const offer: Omit<GenkiOffer, "url"> = {
    priceFrom: best.amount,
    currency: best.currency,
    age: a,
  };
  await kvSetJson(cacheKey, offer, CACHE_TTL_SEC);
  return { ...offer, url: AFF_URL };
}

/** Genki referral/affiliate link (env-overridable). */
export function genkiAffiliateUrl(): string {
  return AFF_URL;
}
