import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = 200;

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

// Best-effort per-instance rate limiting, same approach as /api/generate.
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  const list = (hits.get(ip) ?? []).filter((t) => t > windowStart);
  if (list.length >= RATE_LIMIT) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 10000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= windowStart)) hits.delete(k);
    }
  }
  return false;
}

// Lightweight intake for email signups and country requests. Entries land in
// the deployment logs; wire a real store (DB / form service) when volume
// justifies it.
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  let body: { type?: string; email?: string; country?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const type = body.type === "subscribe" || body.type === "request-country" ? body.type : null;
  if (!type) {
    return Response.json({ error: "Unknown feedback type." }, { status: 400 });
  }

  if (type === "subscribe") {
    const email = (body.email ?? "").trim().slice(0, MAX_LEN);
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: "Enter a valid email." }, { status: 400 });
    }
    console.log(`[feedback] subscribe: ${email}`);
    return Response.json({ ok: true });
  }

  const country = (body.country ?? "").trim().slice(0, MAX_LEN);
  if (!country) {
    return Response.json({ error: "Enter a country." }, { status: 400 });
  }
  console.log(`[feedback] request-country: ${country}`);
  return Response.json({ ok: true });
}
