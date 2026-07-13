import type { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { perIpRateLimited, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

const MAX_LEN = 200;

const RATE_LIMIT = 10;
const RATE_WINDOW_SEC = 60 * 60;

// Persist one entry as a small JSON file in Vercel Blob (visible in the
// Vercel dashboard under Storage). Falls back to deployment logs when no
// blob store is configured (e.g. local dev without the token).
async function store(type: string, value: string): Promise<void> {
  const at = new Date().toISOString();
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log(`[feedback] ${type}: ${value}`);
    return;
  }
  try {
    await put(
      `feedback/${type}/${at.replace(/[:.]/g, "-")}.json`,
      JSON.stringify({ type, value, at }),
      { access: "public", addRandomSuffix: true, contentType: "application/json" },
    );
  } catch (err) {
    console.error(`[feedback] blob write failed, entry: ${type}: ${value}`, err);
  }
}

// Lightweight intake for country requests. No PII is stored: the changelog
// email signup was removed, so only requested country names land in Blob.
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (
    await perIpRateLimited("relo:feedback:ip", ip, RATE_LIMIT, RATE_WINDOW_SEC)
  ) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  let body: { type?: string; country?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.type !== "request-country") {
    return Response.json({ error: "Unknown feedback type." }, { status: 400 });
  }

  const country = (body.country ?? "").trim().slice(0, MAX_LEN);
  if (!country) {
    return Response.json({ error: "Enter a country." }, { status: 400 });
  }
  await store("request-country", country);
  return Response.json({ ok: true });
}
