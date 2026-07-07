import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const PRICE_CENTS = 900; // $9 one-time

// Creates a Stripe Checkout session for unlocking the full plan.
// If Stripe isn't configured (no STRIPE_SECRET_KEY), returns a dev-unlock
// signal so the product is still demoable locally.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const origin =
    req.headers.get("origin") ?? new URL(req.url).origin ?? "http://localhost:3000";

  if (!secret) {
    return Response.json({ devUnlock: true });
  }

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${origin}/?unlocked=1`);
  form.set("cancel_url", `${origin}/?canceled=1`);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", String(PRICE_CENTS));
  form.set(
    "line_items[0][price_data][product_data][name]",
    "Reloka: full personalized relocation plan",
  );

  let res: Response;
  try {
    res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
  } catch {
    return Response.json(
      { error: "Couldn't reach the payment service." },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return Response.json(
      { error: "Payment setup failed.", detail: detail.slice(0, 300) },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) {
    return Response.json({ error: "No checkout URL returned." }, { status: 502 });
  }
  return Response.json({ url: data.url });
}
