import { getProgress, saveProgress } from "@/lib/planStore";

export const runtime = "nodejs";

// Checklist progress lives behind the same capability slug as the plan: anyone
// holding the link may read and update which steps are ticked. Kept separate
// from the plan record so ticking a box never touches the plan or its TTL.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const progress = await getProgress(slug);
  return Response.json({ checked: progress?.checked ?? {} });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const checked = (body as { checked?: unknown })?.checked;
  const progress = await saveProgress(slug, checked);
  if (!progress) {
    return Response.json({ error: "Plan not found." }, { status: 404 });
  }
  return Response.json({ checked: progress.checked });
}
