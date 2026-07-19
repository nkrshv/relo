import { randomBytes } from "node:crypto";
import { kvGetJson, kvSetJson } from "@/lib/ratelimit";
import type { ReloInput, ReloPlan, VisaSummary } from "@/lib/types";

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

const KEY_PREFIX = "relo:plan:";
const UNPAID_TTL_SEC = 60 * 60 * 24 * 30; // 30 days
const PAID_TTL_SEC = 60 * 60 * 24 * 365 * 3; // ~3 years

function keyFor(slug: string): string {
  return `${KEY_PREFIX}${slug}`;
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

// Whitelist the fields safe to hand back to the browser (drops the email).
export function toPublicPlan(record: StoredPlan): PublicPlan {
  return {
    input: record.input,
    plan: record.plan,
    visa: record.visa,
    createdAt: record.createdAt,
    paid: record.paid,
    paidAt: record.paidAt,
  };
}
