import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = 200;

// Lightweight intake for email signups and country requests. Entries land in
// the deployment logs; wire a real store (DB / form service) when volume
// justifies it.
export async function POST(req: NextRequest) {
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
