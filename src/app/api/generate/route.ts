import type { NextRequest } from "next/server";
import {
  PHASE_KEYS,
  PHASE_TITLES,
  type ChecklistItem,
  type Phase,
  type PhaseKey,
  type ReloInput,
  type ReloPlan,
} from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an expert relocation advisor who has helped thousands of people move between countries. Produce a concrete, personalized relocation checklist for one specific person's move.

Respond ONLY with JSON matching this exact shape:
{
  "destinationSummary": string,
  "phases": [
    {
      "key": "before" | "week1" | "month1" | "days90",
      "items": [
        { "title": string, "why": string, "tip": string, "category": string, "estimate": string }
      ]
    }
  ]
}

Rules:
- Include all four phases exactly once, in this order: "before", "week1", "month1", "days90".
- "before" = tasks to do before leaving the origin country. "week1" = urgent tasks in the first week after arrival. "month1" = tasks within the first month. "days90" = tasks within the first 90 days.
- 4 to 7 items per phase. Be specific to the origin country, destination country, and the person's profile, visa status, and stated priorities.
- "title": short imperative action (e.g. "Open a local bank account").
- "why": one sentence explaining why it matters or a gotcha to avoid.
- "tip": a concrete, practical tip (a document to prepare, a common mistake, a rough cost). Keep it short.
- "category": one short label such as "Housing", "Banking", "Healthcare", "Residency", "Taxes", "Logistics", "Pets", "Schooling".
- "estimate": rough time or cost when relevant (e.g. "1-2 weeks", "~€150"), otherwise an empty string.
- Prioritize the priorities the user selected. Do not invent visa rules you are unsure about; phrase uncertain items as "check the official requirements for ...".
- Be practical and specific, never generic filler.`;

interface RawItem {
  title?: unknown;
  why?: unknown;
  tip?: unknown;
  category?: unknown;
  estimate?: unknown;
}

interface RawPhase {
  key?: unknown;
  items?: unknown;
}

interface RawPlan {
  destinationSummary?: unknown;
  phases?: unknown;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeItem(raw: RawItem): ChecklistItem | null {
  const title = str(raw.title);
  if (!title) return null;
  return {
    title,
    why: str(raw.why),
    tip: str(raw.tip) || undefined,
    category: str(raw.category) || "General",
    estimate: str(raw.estimate) || undefined,
  };
}

function normalizePlan(raw: RawPlan): ReloPlan {
  const rawPhases = Array.isArray(raw.phases) ? (raw.phases as RawPhase[]) : [];
  const byKey = new Map<PhaseKey, ChecklistItem[]>();
  for (const rp of rawPhases) {
    const key = str(rp.key) as PhaseKey;
    if (!PHASE_KEYS.includes(key)) continue;
    const items = Array.isArray(rp.items) ? (rp.items as RawItem[]) : [];
    const normalized = items
      .map(normalizeItem)
      .filter((i): i is ChecklistItem => i !== null);
    byKey.set(key, normalized);
  }

  const phases: Phase[] = PHASE_KEYS.map((key) => ({
    key,
    title: PHASE_TITLES[key],
    items: byKey.get(key) ?? [],
  })).filter((p) => p.items.length > 0);

  return {
    destinationSummary: str(raw.destinationSummary),
    phases,
  };
}

function buildUserContent(input: ReloInput): string {
  return [
    `Moving from: ${input.fromCountry}`,
    `Moving to: ${input.toCountry}`,
    `Profile: ${input.profile}`,
    input.visaStatus ? `Visa / status: ${input.visaStatus}` : "",
    input.timeline ? `Timeline: ${input.timeline}` : "",
    input.priorities.length
      ? `Top priorities: ${input.priorities.join(", ")}`
      : "",
    input.budget ? `Budget: ${input.budget}` : "",
    input.notes ? `Extra context: ${input.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI isn't configured yet. Add an OPENAI_API_KEY." },
      { status: 503 },
    );
  }

  let body: Partial<ReloInput>;
  try {
    body = (await req.json()) as Partial<ReloInput>;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fromCountry = str(body.fromCountry);
  const toCountry = str(body.toCountry);
  if (!fromCountry || !toCountry) {
    return Response.json(
      { error: "Both origin and destination country are required." },
      { status: 400 },
    );
  }

  const input: ReloInput = {
    fromCountry,
    toCountry,
    profile: (body.profile as ReloInput["profile"]) ?? "solo",
    visaStatus: str(body.visaStatus),
    timeline: str(body.timeline),
    priorities: Array.isArray(body.priorities)
      ? body.priorities.map(str).filter(Boolean)
      : [],
    budget: str(body.budget) || undefined,
    notes: str(body.notes) || undefined,
  };

  let aiRes: Response;
  try {
    aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserContent(input) },
        ],
      }),
    });
  } catch {
    return Response.json(
      { error: "Couldn't reach the AI service." },
      { status: 502 },
    );
  }

  if (!aiRes.ok) {
    const detail = await aiRes.text().catch(() => "");
    return Response.json(
      { error: "The AI request failed.", detail: detail.slice(0, 300) },
      { status: 502 },
    );
  }

  const data = (await aiRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";

  let parsed: RawPlan;
  try {
    parsed = JSON.parse(content) as RawPlan;
  } catch {
    return Response.json(
      { error: "The AI returned an unexpected format." },
      { status: 502 },
    );
  }

  const plan = normalizePlan(parsed);
  if (plan.phases.length === 0) {
    return Response.json(
      { error: "The AI returned an empty plan. Try again." },
      { status: 502 },
    );
  }

  return Response.json({ input, plan });
}
