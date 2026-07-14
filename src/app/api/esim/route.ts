import type { NextRequest } from "next/server";
import {
  getEsimOffer,
  buildTrackingUrl,
  debugFetchRaw,
  diagnoseFetch,
} from "@/lib/saily";
import { perIpRateLimited, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

const RATE_LIMIT = 60;
const RATE_WINDOW_SEC = 60 * 60;

// Native eSIM pricing for a destination (ISO alpha-2). Cached server-side, so
// this is cheap; a light per-IP cap only guards against scripted abuse.
export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (await perIpRateLimited("relo:esim:ip", ip, RATE_LIMIT, RATE_WINDOW_SEC)) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const params = new URL(req.url).searchParams;
  const country = (params.get("country") ?? "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    return Response.json(
      { error: "country must be an ISO 3166-1 alpha-2 code" },
      { status: 400 },
    );
  }

  // Safe upstream reachability diagnostic (metadata only, no plan data).
  if (params.get("diag") === "1") {
    return Response.json({ country, diag: await diagnoseFetch(country) });
  }

  // Preview-only: expose the raw shape to confirm reachability + parsing.
  if (
    params.get("debug") === "1" &&
    process.env.VERCEL_ENV !== "production"
  ) {
    const raw = await debugFetchRaw(country);
    return Response.json({ country, raw });
  }

  const offer = await getEsimOffer(country);
  if (!offer) return Response.json({ country, available: false });

  const url = offer.destinationUrl
    ? buildTrackingUrl(offer.destinationUrl, crypto.randomUUID())
    : null;
  return Response.json({
    country: offer.country,
    available: true,
    pricePerGbUsd: offer.pricePerGbUsd,
    plan: offer.plan,
    currency: offer.currency,
    url,
  });
}
