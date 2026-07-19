import type { NextRequest } from "next/server";
import { isValidSlug } from "@/lib/planStore";

export const runtime = "nodejs";

// Creates a Lemon Squeezy checkout for unlocking the full plan. The plan's
// slug rides along in `custom` so the webhook can mark exactly this plan paid,
// and the buyer is sent back to their permanent link on success.
//
// If Lemon Squeezy isn't configured (no API key / store / variant), returns a
// dev-unlock signal so the product stays demoable locally.
export async function POST(req: NextRequest) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;

  const origin =
    req.headers.get("origin") ??
    new URL(req.url).origin ??
    "http://localhost:3000";

  let slug: string | undefined;
  try {
    const body = (await req.json()) as { slug?: unknown };
    if (typeof body.slug === "string" && isValidSlug(body.slug)) {
      slug = body.slug;
    }
  } catch {
    // no body / invalid JSON — proceed without a slug
  }

  if (!apiKey || !storeId || !variantId) {
    return Response.json({ devUnlock: true });
  }

  // On success return the buyer to their permanent plan link (or the home
  // page if we somehow have no slug), flagged so the client starts polling.
  const redirectUrl = slug
    ? `${origin}/plan/${slug}?paid=1`
    : `${origin}/?paid=1`;

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          custom: slug ? { slug } : {},
        },
        product_options: {
          redirect_url: redirectUrl,
        },
      },
      relationships: {
        store: { data: { type: "stores", id: String(storeId) } },
        variant: { data: { type: "variants", id: String(variantId) } },
      },
    },
  };

  let res: Response;
  try {
    res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
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

  const data = (await res.json()) as {
    data?: { attributes?: { url?: string } };
  };
  const url = data.data?.attributes?.url;
  if (!url) {
    return Response.json(
      { error: "No checkout URL returned." },
      { status: 502 },
    );
  }
  return Response.json({ url });
}
