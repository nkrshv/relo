import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { sendPlanLinkEmail } from "@/lib/email";
import {
  isValidSlug,
  markPlanEmailed,
  markPlanPaid,
  markPlanRefunded,
} from "@/lib/planStore";

export const runtime = "nodejs";

// Lemon Squeezy webhook. Every payload is HMAC-SHA256 signed with our webhook
// secret over the raw request body; we reject anything that doesn't verify so
// a spoofed request can never unlock a plan. On a verified order we flip the
// plan's server-side `paid` flag (the only source of truth for unlock) and
// email the buyer their permanent link once.
interface LsWebhook {
  meta?: { event_name?: string; custom_data?: { slug?: unknown } };
  data?: { attributes?: { user_email?: unknown } };
}

function verify(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    // Misconfiguration: fail closed rather than trusting unsigned payloads.
    return Response.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const raw = await req.text();
  if (!verify(raw, req.headers.get("x-signature"), secret)) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: LsWebhook;
  try {
    body = JSON.parse(raw) as LsWebhook;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const event = body.meta?.event_name;
  const rawSlug = body.meta?.custom_data?.slug;
  const slug = typeof rawSlug === "string" && isValidSlug(rawSlug) ? rawSlug : null;

  // Custom data is our only link back to the plan; without it there is nothing
  // to unlock, but the delivery itself was valid so we ack it.
  if (!slug) {
    return Response.json({ ok: true, ignored: "no-slug" });
  }

  if (event === "order_refunded") {
    await markPlanRefunded(slug);
    return Response.json({ ok: true });
  }

  if (event === "order_created") {
    const emailRaw = body.data?.attributes?.user_email;
    const email = typeof emailRaw === "string" ? emailRaw : null;

    const record = await markPlanPaid(slug, email);
    if (!record) {
      return Response.json({ ok: true, ignored: "unknown-slug" });
    }

    // Send the permanent-link email exactly once. A duplicate webhook finds
    // emailedAt already set and skips resending.
    if (email && !record.emailedAt) {
      const sent = await sendPlanLinkEmail(email, slug);
      if (sent) await markPlanEmailed(slug);
    }
    return Response.json({ ok: true });
  }

  return Response.json({ ok: true, ignored: event ?? "unknown-event" });
}
