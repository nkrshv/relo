import type { NextRequest } from "next/server";
import { factsForCountry } from "@/lib/countryFacts";
import { advisoryForCountry, impactForProfile } from "@/lib/countryAdvisory";
import { visaRequirementBetween } from "@/lib/visaMatrix";
import {
  insightsForCountry,
  climateSummary,
  wettestMonths,
} from "@/lib/countryInsights";
import { staticDataForCountry } from "@/lib/staticCountryData";
import {
  PHASE_KEYS,
  PHASE_TITLES,
  type ChecklistItem,
  type Feasibility,
  type Phase,
  type PhaseKey,
  type ReloInput,
  type ReloPlan,
} from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a senior relocation advisor with deep, current, country-specific knowledge (visa schemes, tax registration, healthcare enrolment, banking, housing portals) for moves between specific countries. You produce checklists that feel like they were written by someone who has personally done this exact move — not generic advice anyone could guess.

Respond ONLY with JSON matching this exact shape:
{
  "destinationSummary": string,
  "feasibility": { "level": "ok" | "caution" | "blocked", "note": string },
  "phases": [
    {
      "key": "before" | "week1" | "month1" | "days90",
      "items": [
        {
          "title": string,
          "why": string,
          "tip": string,
          "category": string,
          "estimate": string,
          "url": string,
          "steps": string[],
          "documents": string[],
          "deadline": string,
          "commonMistake": string
        }
      ]
    }
  ]
}

FEASIBILITY CHECK (do this FIRST, before writing the checklist):
- Assess whether this specific move (this origin → this destination, for this person's profile and visa status) is currently legally and practically possible as of today.
- Consider: active wars or armed conflict, closed borders, entry bans or sanctions tied to the person's nationality, mobilization/conscription rules that bar exit or entry (e.g. male citizens of a certain age), suspended visa routes, or no diplomatic relations.
- "level": "blocked" = the move is currently illegal, impossible, or extremely dangerous for this specific person (e.g. a Russian male of conscription age moving to Ukraine during the war); "caution" = legal but with serious active risks or major restrictions the person must know (war nearby, sanctions affecting banking, unusual visa hurdles); "ok" = a normal, feasible move.
- "note": one or two plain-language sentences. For "blocked"/"caution", state the concrete restriction and who it applies to. For "ok", use an empty string "".
- If "blocked": still return the phases, but frame the FIRST phase around the legal/safety reality (e.g. official routes, safer alternatives, what would need to change) rather than pretending it's a routine move. Never output steps that assume an impossible move is fine.
- Base this on well-established, widely-known geopolitical facts. Do not invent conflicts or bans.
- If an OFFICIAL TRAVEL ADVISORY block is provided below, treat it as authoritative current ground truth about the destination and let it drive the feasibility level: a Level 4 (Do Not Travel), any "do not travel" areas, or a declared state of emergency means the destination itself is dangerous — set "caution" at minimum, and "blocked" if it combines with a nationality/conscription barrier. A Level 3 (Reconsider Travel) should be at least "caution". Reflect the concrete reason from the advisory in the "note". Do NOT contradict the advisory's level or downplay it.

Structure rules:
- Include all four phases exactly once, in this order: "before", "week1", "month1", "days90".
- "before" = tasks before leaving the origin country. "week1" = urgent tasks in the first week after arrival. "month1" = within the first month. "days90" = within the first 90 days.
- 4 to 7 items per phase. Every item must be specific to the destination country (and where relevant the origin country) and the person's profile, visa status, and selected priorities.
- "category": one short label such as "Housing", "Banking", "Healthcare", "Residency", "Taxes", "Logistics", "Pets", "Schooling".
- "estimate": a concrete time or cost when relevant (e.g. "1-2 weeks", "~€200", "€75 fee"), otherwise "".

SPECIFICITY IS MANDATORY. This is the whole product — generic advice is worthless.
- Every single item MUST contain at least one concrete, destination-specific fact the person would NOT already know: the exact name of the government body / office / portal (e.g. in Portugal: Finanças for the NIF, AIMA for residency, Segurança Social, SNS for health; use the correct real equivalents for the actual destination), a specific document name, a real threshold, deadline, fee, or number.
- BANNED: vague filler verbs and phrases such as "research", "look into", "check the local authorities", "familiarize yourself with", "consider your options", "understand the requirements", "be aware of", "make sure to". If a sentence would still be true for any country on earth, rewrite it until it is specific to THIS destination.
- Instead of "check the tax authority", say exactly WHICH authority, what you register for, and the concrete step (e.g. "Register for a tax ID (NIF) at a Finanças office or via a fiscal representative; non-EU residents usually need a representative").
- "title": specific imperative naming the real thing (e.g. "Register for your NIF at Finanças", not "Sort out taxes").
- "why": one sentence with the real consequence or gotcha (what breaks if you skip it), not a platitude.
- "tip": a concrete, insider detail — a specific document to bring, a real portal/website, a realistic cost or wait time.
- "steps": 2 to 4 concrete sub-actions describing HOW to actually complete this item, in order — where exactly to go or which portal/form to use, what to book or request, what happens next. Each step is one short imperative sentence with real names (offices, forms, portals). Never restate the title; never pad with filler. Use [] only when the item genuinely has a single trivial action.
- "documents": the exact papers/artifacts to bring or prepare for this item (e.g. "Passport", "Proof of address (rental contract)", "Apostilled birth certificate", "3 months of bank statements"). Use [] when none are needed.
- "deadline": the hard legal or practical deadline if one exists (e.g. "Within 14 days of moving in", "Within 30 days of arrival", "Before your visa appointment"), otherwise "".
- "commonMistake": the single most common way people get this step wrong and its consequence, one sentence (e.g. "Booking the Anmeldung appointment after arrival — slots in big cities are gone weeks ahead, blocking your bank account and tax ID"). Use "" only if there is genuinely no notable pitfall.
- "url": the official website for the specific institution, portal, or scheme named in this item (e.g. the tax authority, immigration agency, health service, or the housing/banking portal). RULES for url: (1) only a real, well-established OFFICIAL domain you are confident exists — prefer government sites (.gov, .gob, country TLDs) or the well-known official portal; (2) use the site's ROOT homepage (https://domain/) NOT a deep path, since deep links go stale and 404; (3) if you are not confident of the exact real domain, use an empty string "" — NEVER guess, invent, or approximate a URL. A wrong link is far worse than no link.

PROFILE MODULES — mandatory extra coverage depending on who is moving:
- "family" profile: MUST include at least one item on school/kindergarten enrolment (real system names, application windows, catchment/registration rules) and one on registering children for healthcare/vaccination records.
- "student" profile: MUST cover student-specific residence conditions, enrolment confirmation for the visa, and student health insurance rules.
- "nomad" / remote-worker profile: MUST include an item on tax residency (the 183-day rule or the destination's specific trigger, and what registration it forces) and on whether the visa route actually permits remote work for foreign employers.
- If the user's priorities include "Pets": MUST include pet import rules (microchip, rabies vaccination timing, health certificate, the destination's animal-import authority) as a "before" item with real lead times.
- If the user's priorities include "Driving license": MUST include the destination's license exchange/validity rule (whether the origin country's license can be exchanged or a local test is required, and the deadline).

PERSONALIZATION IS MANDATORY — the plan must visibly reflect THIS user's inputs, not just the destination:
- Every concrete detail the user gives (a budget cap, a rent limit, total savings, children's ages, pet species/breed, a spouse's job plans, an employer situation, a stated timeline) MUST appear verbatim or near-verbatim inside at least one relevant item's title, why, tip, steps or commonMistake. Example: if they say "rent under 1500 eur", the housing item must reference searching with a ≤€1,500 filter and what that budget realistically gets in that market; if a spouse will look for local work, add an item about local work authorization / job-search realities and required registrations.
- Children's ages change the advice (kindergarten vs primary vs secondary enrolment) — use the actual ages given.
- If the user gave NO visa / status information, do NOT silently pick one visa route for them. Make the FIRST "before" item a comparison of the 2-3 realistic visa/residency routes for this origin nationality and profile (real scheme names, income thresholds, processing times) ending with how to decide; base later items on requirements common to those routes.
- Weave the user's stated budget, timeline and notes into item choices and estimates — never ignore them.

Accuracy: use real, well-established facts about the destination. If you are unsure of an exact current figure (income threshold, fee), still name the specific scheme/office and add "verify the current figure on the official [named authority] site" — never fall back to generic advice. Do NOT invent fake office names or laws.`;

const CRITIC_PROMPT = `You are a merciless relocation-content editor reviewing a draft checklist for the move described by the user. Your single job: eliminate every trace of generic advice and add real, verifiable depth. Return the FULL corrected plan as JSON in exactly the same shape you received — same phases, same field names.

For EVERY item in the draft:
1. If the title, why, tip, steps or commonMistake could apply to more than one country, rewrite them with destination-specific substance: the real office/portal/form name, the actual fee or threshold (approximate is fine — add "verify the current figure on [named authority]" if it changes yearly), the real waiting time, the real order of operations.
2. If "steps" is empty, too short, or just restates the title — write 2–4 real sub-actions (which office/portal, which form, what to book, what happens after).
3. If "documents" is empty but the process obviously requires papers — list the exact documents.
4. If "deadline" is empty but a legal deadline exists — add it. If "commonMistake" is empty or bland — replace it with the real pitfall people hit for this exact step.
5. Replace filler items ("join communities", "explore the city", "familiarize yourself with X") with concrete, destination-specific items. Do NOT shrink the plan: every phase must keep at least 4 items — when you cut filler, add a real missing task for this move (e.g. SIM/eSIM registration rules, utility contracts, license exchange, apostilles) instead.
6. Personalization audit: re-read the user's message and verify every concrete detail they gave (budget or rent cap, savings, children's ages, pets, spouse's work plans, employer situation, timeline) is reflected in at least one item. If any detail is missing from the draft, weave it into the most relevant item or add a dedicated item for it. If the user gave no visa/status info, ensure the plan compares realistic visa routes rather than assuming one.
7. Keep everything consistent with the VERIFIED FACTS and OFFICIAL TRAVEL ADVISORY blocks if they were provided — they are ground truth. Never invent office names, laws, or URLs; for url keep the same rules (official root domain or "").
8. Do NOT change the JSON structure, phase keys, or feasibility level; you may sharpen the feasibility note's wording.

Be aggressive: a rewritten plan where 80% of fields changed is expected. Respond ONLY with the JSON.`;

interface RawItem {
  title?: unknown;
  why?: unknown;
  tip?: unknown;
  category?: unknown;
  estimate?: unknown;
  url?: unknown;
  steps?: unknown;
  documents?: unknown;
  deadline?: unknown;
  commonMistake?: unknown;
}

interface RawPhase {
  key?: unknown;
  items?: unknown;
}

interface RawPlan {
  destinationSummary?: unknown;
  feasibility?: unknown;
  phases?: unknown;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeUrl(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    if (!u.hostname.includes(".")) return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

function strList(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.map(str).filter(Boolean);
  return out.length ? out : undefined;
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
    url: normalizeUrl(raw.url),
    steps: strList(raw.steps),
    documents: strList(raw.documents),
    deadline: str(raw.deadline) || undefined,
    commonMistake: str(raw.commonMistake) || undefined,
  };
}

function normalizeFeasibility(raw: unknown): Feasibility | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as { level?: unknown; note?: unknown };
  const level = str(r.level);
  if (level !== "caution" && level !== "blocked") return undefined;
  return { level, note: str(r.note) };
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
    feasibility: normalizeFeasibility(raw.feasibility),
    phases,
  };
}

function buildUserContent(input: ReloInput): string {
  const profile = [
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

  const blocks = [profile];

  const advisory = advisoryForCountry(input.toCountry);
  if (advisory) {
    const impact = impactForProfile(advisory, input.profile);
    const lines = [
      `OFFICIAL TRAVEL ADVISORY for ${advisory.name} (U.S. State Department${advisory.updatedAt ? `, updated ${advisory.updatedAt}` : ""}). Authoritative current ground truth — use it for the feasibility check.`,
      `- Advisory level: ${advisory.level} (${advisory.label})`,
    ];
    if (advisory.reasons.length)
      lines.push(`- Reasons: ${advisory.reasons.join("; ")}`);
    if (advisory.doNotTravel.length)
      lines.push(`- Do-not-travel areas: ${advisory.doNotTravel.join("; ")}`);
    if (advisory.restrictions.length)
      lines.push(`- Restrictions: ${advisory.restrictions.join("; ")}`);
    if (advisory.stateOfEmergency)
      lines.push(`- A state of emergency is currently declared.`);
    if (impact.detail)
      lines.push(
        `- Risk for this profile (${input.profile}, ${impact.level}): ${impact.detail}`,
      );
    blocks.push(lines.join("\n"));
  }

  const visa = visaRequirementBetween(input.fromCountry, input.toCountry);
  if (visa) {
    blocks.push(
      [
        `SHORT-STAY VISA RULE (Passport Index dataset, updated ${visa.updatedAt}) for a ${input.fromCountry} passport holder entering ${input.toCountry}: ${visa.label}.`,
        `This covers tourist/short stays only — long-term relocation still needs the residence route. Use it to ground advice about scouting trips, visa-run realities, and whether the person can enter first and regularize later.`,
      ].join("\n"),
    );
  }

  const insights = insightsForCountry(input.toCountry);
  const staticData = staticDataForCountry(input.toCountry);
  if (insights || staticData) {
    const lines = [
      `DESTINATION DATA (free official/open sources — treat as ground truth):`,
    ];
    if (insights) {
      const climate = climateSummary(insights);
      if (climate)
        lines.push(
          `- Climate in ${insights.climate.city}: mean daily temp ${climate}${wettestMonths(insights) ? `; wettest months: ${wettestMonths(insights)}` : ""} (Open-Meteo, ${insights.climate.year}). Use for packing/wardrobe and housing (heating/AC) advice.`,
        );
      if (insights.holidays)
        lines.push(
          `- Public holidays ${insights.holidays.year}: ${insights.holidays.count} national holidays, e.g. ${insights.holidays.sample
            .slice(0, 4)
            .map((h) => `${h.name} (${h.date})`)
            .join(", ")} (Nager.Date). Government offices close on these — warn about booking appointments around them.`,
        );
      if (insights.inflation)
        lines.push(
          `- Inflation (CPI, ${insights.inflation.year}): ${insights.inflation.value}% (World Bank).`,
        );
      if (insights.lifeExpectancy)
        lines.push(
          `- Life expectancy: ${insights.lifeExpectancy.value} years (WHO, ${insights.lifeExpectancy.year}).`,
        );
      if (insights.bigMacUsd)
        lines.push(
          `- Big Mac price: ~$${insights.bigMacUsd.value} USD (The Economist, ${insights.bigMacUsd.date}) — a rough price-level signal.`,
        );
    }
    if (staticData) {
      lines.push(
        `- Internet: median fixed broadband ~${staticData.internetMbps} Mbps (Ookla Speedtest Global Index).`,
        `- Electricity: ${staticData.voltage}, plug type(s) ${staticData.plugTypes.join(", ")} — mention adapters/appliances if the origin differs.`,
        `- English proficiency: ${staticData.english}${staticData.english === "native" ? "" : " (EF EPI)"} — calibrate language-prep advice accordingly.`,
      );
    }
    if (lines.length > 1) blocks.push(lines.join("\n"));
  }

  const facts = factsForCountry(input.toCountry);
  if (facts) {
    const factBlock = [
      `VERIFIED FACTS about ${input.toCountry} — these are current and authoritative. Treat them as ground truth: they OVERRIDE your training data wherever they conflict (institution names change over time). Weave the relevant ones into the checklist; never contradict them.`,
      ...facts.map((f) => `- ${f}`),
    ].join("\n");
    blocks.push(factBlock);
  }

  return blocks.join("\n\n");
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

  const userContent = buildUserContent(input);

  // Pass 1: draft plan.
  let draftContent: string;
  try {
    draftContent = await callModel(apiKey, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ]);
  } catch (e) {
    return Response.json(
      { error: "The AI request failed.", detail: String(e).slice(0, 300) },
      { status: 502 },
    );
  }

  let parsed: RawPlan;
  try {
    parsed = JSON.parse(draftContent) as RawPlan;
  } catch {
    return Response.json(
      { error: "The AI returned an unexpected format." },
      { status: 502 },
    );
  }

  // Pass 2: critic/deepening pass. On any failure fall back to the draft.
  try {
    const critiqued = await callModel(apiKey, [
      { role: "system", content: CRITIC_PROMPT },
      {
        role: "user",
        content: `${userContent}\n\nDRAFT PLAN TO REVIEW AND DEEPEN:\n${JSON.stringify(parsed)}`,
      },
    ]);
    const revised = JSON.parse(critiqued) as RawPlan;
    const revisedPlan = normalizePlan(revised);
    if (revisedPlan.phases.length > 0) {
      // Feasibility level must not be weakened by the critic.
      revisedPlan.feasibility =
        normalizeFeasibility(parsed.feasibility) ?? revisedPlan.feasibility;
      return Response.json({
        input,
        plan: revisedPlan,
        visa: visaRequirementBetween(input.fromCountry, input.toCountry),
      });
    }
  } catch {
    // fall through to the draft
  }

  const plan = normalizePlan(parsed);
  if (plan.phases.length === 0) {
    return Response.json(
      { error: "The AI returned an empty plan. Try again." },
      { status: 502 },
    );
  }

  return Response.json({
    input,
    plan,
    visa: visaRequirementBetween(input.fromCountry, input.toCountry),
  });
}

async function callModel(
  apiKey: string,
  messages: Array<{ role: "system" | "user"; content: string }>,
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail.slice(0, 300) || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}
