import { getPlan, toPublicPlan } from "@/lib/planStore";

export const runtime = "nodejs";

// Read a saved plan by its capability slug. Returns only whitelisted fields
// (never the buyer email), so sharing the link never leaks the purchaser.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const record = await getPlan(slug);
  if (!record) {
    return Response.json({ error: "Plan not found." }, { status: 404 });
  }
  return Response.json(toPublicPlan(record));
}
