import { randomBytes } from "node:crypto";
import { kvGetJson, kvSetJson } from "@/lib/ratelimit";
import type {
  ChecklistItem,
  ReloInput,
  ReloPlan,
  VisaSummary,
} from "@/lib/types";

// A saved plan is addressed by an unguessable slug: the link IS the key
// (a capability link). Anyone with the link can read the plan, so the slug
// carries 128 bits of entropy and the record never exposes the buyer email
// to GET callers.
export interface StoredPlan {
  input: ReloInput;
  plan: ReloPlan;
  visa: VisaSummary | null;
  createdAt: string;
  paid: boolean;
  paidAt?: string;
  /** Buyer email from the payment webhook. Server-only; never returned to clients. */
  email?: string;
  emailedAt?: string;
}

// What a GET /api/plan/[slug] caller is allowed to see: everything except the
// buyer email, so sharing the link never leaks the purchaser's address.
export type PublicPlan = Omit<StoredPlan, "email" | "emailedAt">;

// Freemium: only the first phase ("Before you go") is a free preview. Every
// later phase is paid content and must never leave the server for an unpaid
// caller — the browser-side blur is presentation only, not access control.
const FREE_PHASE_COUNT = 1;

const KEY_PREFIX = "relo:plan:";
const PROGRESS_PREFIX = "relo:progress:";
const UNPAID_TTL_SEC = 60 * 60 * 24 * 30; // 30 days
const PAID_TTL_SEC = 60 * 60 * 24 * 365 * 3; // ~3 years

// A user cannot have more checklist items than the plan holds; this cap just
// guards the store against an abusive payload on the public write endpoint.
const MAX_PROGRESS_ENTRIES = 500;

function keyFor(slug: string): string {
  return `${KEY_PREFIX}${slug}`;
}

function progressKeyFor(slug: string): string {
  return `${PROGRESS_PREFIX}${slug}`;
}

// URL-safe, unguessable slug with 128 bits of entropy (16 random bytes,
// base64url without padding → 22 chars).
export function mintSlug(): string {
  return randomBytes(16).toString("base64url");
}

// A slug we minted: base64url characters only, reasonable length. Guards the
// dynamic route against absurd keys before we hit the store.
export function isValidSlug(slug: string): boolean {
  return /^[A-Za-z0-9_-]{16,64}$/.test(slug);
}

export async function savePlan(slug: string, record: StoredPlan): Promise<void> {
  await kvSetJson(
    keyFor(slug),
    record,
    record.paid ? PAID_TTL_SEC : UNPAID_TTL_SEC,
  );
}

export async function getPlan(slug: string): Promise<StoredPlan | null> {
  if (!isValidSlug(slug)) return null;
  return kvGetJson<StoredPlan>(keyFor(slug));
}

// Mark a plan paid from a verified payment webhook. Idempotent: paidAt is set
// once, and the buyer email is stored server-side (never exposed by GET).
// Returns the updated record, or null if the plan no longer exists.
export async function markPlanPaid(
  slug: string,
  email: string | null,
): Promise<StoredPlan | null> {
  const record = await getPlan(slug);
  if (!record) return null;
  const updated: StoredPlan = {
    ...record,
    paid: true,
    paidAt: record.paidAt ?? new Date().toISOString(),
    email: email ?? record.email,
  };
  await savePlan(slug, updated);
  return updated;
}

// Record that the permanent-link email was sent, so a duplicate webhook never
// sends a second copy.
export async function markPlanEmailed(slug: string): Promise<void> {
  const record = await getPlan(slug);
  if (!record) return;
  await savePlan(slug, { ...record, emailedAt: new Date().toISOString() });
}

// Revoke access after a refund or chargeback. Keeps the record (and its email)
// but flips paid back off.
export async function markPlanRefunded(slug: string): Promise<void> {
  const record = await getPlan(slug);
  if (!record) return;
  await savePlan(slug, { ...record, paid: false });
}

// Checklist completion for a plan, kept in its own key so ticking a box never
// rewrites (or reschedules the TTL of) the plan record itself. Keyed by the
// same capability slug: anyone holding the link can read and update progress,
// exactly like the plan it belongs to.
export interface PlanProgress {
  /** Item id ("<phase>:<item>") → checked. Only true entries are kept. */
  checked: Record<string, boolean>;
  updatedAt: string;
}

// Item ids are "<phaseIndex>:<itemIndex>". Drop anything else and keep only the
// checked (true) entries, so the stored map stays small and well-formed.
function sanitizeChecked(input: unknown): Record<string, boolean> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, boolean> = {};
  let n = 0;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (n >= MAX_PROGRESS_ENTRIES) break;
    if (value === true && /^\d{1,3}:\d{1,3}$/.test(key)) {
      out[key] = true;
      n += 1;
    }
  }
  return out;
}

export async function getProgress(slug: string): Promise<PlanProgress | null> {
  if (!isValidSlug(slug)) return null;
  return kvGetJson<PlanProgress>(progressKeyFor(slug));
}

// Persist checklist progress for an existing plan. Returns null when the slug
// has no plan (so a bogus link cannot seed arbitrary keys). Progress inherits
// the plan's retention so it lives exactly as long as the plan does.
export async function saveProgress(
  slug: string,
  checked: unknown,
): Promise<PlanProgress | null> {
  const record = await getPlan(slug);
  if (!record) return null;
  const progress: PlanProgress = {
    checked: sanitizeChecked(checked),
    updatedAt: new Date().toISOString(),
  };
  await kvSetJson(
    progressKeyFor(slug),
    progress,
    record.paid ? PAID_TTL_SEC : UNPAID_TTL_SEC,
  );
  return progress;
}

// Real paywall only exists once Lemon Squeezy is configured; without it the app
// stays fully demoable (checkout returns a dev-unlock), so plans are served in
// full rather than teasing content that can never be unlocked.
export function paymentsConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      process.env.LEMONSQUEEZY_VARIANT_ID,
  );
}

// A locked phase is reduced to blank placeholder rows: the count survives so
// the preview can honestly say how much more the plan holds, but no task title,
// reason, step, link or tip ever reaches an unpaid browser.
function lockedPlaceholder(): ChecklistItem {
  return {
    title: "Unlock the full plan to see this step",
    why: "",
    category: "",
  };
}

// The free preview: the first phase in full, later phases stripped to
// placeholder rows. This is what an unpaid caller is allowed to receive.
export function previewPlan(plan: ReloPlan): ReloPlan {
  return {
    ...plan,
    phases: plan.phases.map((phase, i) =>
      i < FREE_PHASE_COUNT
        ? phase
        : { ...phase, items: phase.items.map(() => lockedPlaceholder()) },
    ),
  };
}

// The plan a browser may see for this record: the full plan when paid (or when
// no paywall is configured), otherwise the free preview. This is the single
// server-side access-control boundary for paid phases.
export function visiblePlan(record: StoredPlan): ReloPlan {
  if (record.paid || !paymentsConfigured()) return record.plan;
  return previewPlan(record.plan);
}

// Whitelist the fields safe to hand back to the browser (drops the email) and
// redacts paid phases for unpaid callers.
export function toPublicPlan(record: StoredPlan): PublicPlan {
  return {
    input: record.input,
    plan: visiblePlan(record),
    visa: record.visa,
    createdAt: record.createdAt,
    paid: record.paid,
    paidAt: record.paidAt,
  };
}
