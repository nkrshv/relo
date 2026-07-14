import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Shared, cross-instance limiting for the unauthenticated OpenAI-backed
// endpoints. On serverless each instance has its own memory, so an in-memory
// counter caps nothing globally: it is only a per-instance fallback for local
// dev / when no store is configured. When Upstash (or Vercel KV, which is
// Upstash under the hood) is wired up via env, limits become truly global.
//
// Env (either set works; Vercel KV integration injects the KV_* names):
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
//   KV_REST_API_URL       / KV_REST_API_TOKEN

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

export function limiterConfigured(): boolean {
  return getRedis() !== null;
}

// --- Generic best-effort JSON cache on the shared store ------------------
// Used to cache slow/expensive external lookups (e.g. Saily eSIM plans).
// No-ops without a store and never throws, so callers degrade gracefully.

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return (await r.get<T>(key)) ?? null;
  } catch {
    return null;
  }
}

export async function kvSetJson(
  key: string,
  value: unknown,
  ttlSec: number,
): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, value, { ex: ttlSec });
  } catch {
    // best-effort cache only
  }
}

// --- Per-IP sliding window (anti-abuse) ---------------------------------

const ipLimiters = new Map<string, Ratelimit>();

function ipLimiter(prefix: string, limit: number, windowSec: number) {
  const key = `${prefix}:${limit}:${windowSec}`;
  let rl = ipLimiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis: getRedis() as Redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix,
      analytics: false,
    });
    ipLimiters.set(key, rl);
  }
  return rl;
}

// In-memory fallback (per instance) used only when no store is configured.
const memHits = new Map<string, number[]>();

function memRateLimited(
  bucket: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const list = (memHits.get(bucket) ?? []).filter((t) => t > windowStart);
  if (list.length >= limit) {
    memHits.set(bucket, list);
    return true;
  }
  list.push(now);
  memHits.set(bucket, list);
  if (memHits.size > 10000) {
    for (const [k, v] of memHits) {
      if (v.every((t) => t <= windowStart)) memHits.delete(k);
    }
  }
  return false;
}

export async function perIpRateLimited(
  prefix: string,
  ip: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  const r = getRedis();
  if (!r) return memRateLimited(`${prefix}:${ip}`, limit, windowSec * 1000);
  try {
    const { success } = await ipLimiter(prefix, limit, windowSec).limit(ip);
    return !success;
  } catch {
    // Never fail the request because the limiter store is unreachable; fall
    // back to the per-instance guard so we still cap casual abuse.
    return memRateLimited(`${prefix}:${ip}`, limit, windowSec * 1000);
  }
}

// --- Global daily OpenAI token budget (cost / free-tier protection) ------

// Defaults to OpenAI's shared free-tier daily allowance for the gpt-4o bucket
// (250k tokens/day). Override with OPENAI_DAILY_TOKEN_BUDGET; leave some
// headroom below the real ceiling since accounting is best-effort.
export const DAILY_TOKEN_BUDGET = (() => {
  const raw = Number(process.env.OPENAI_DAILY_TOKEN_BUDGET);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 250_000;
})();

function todayKey(): string {
  return `relo:openai:tokens:${new Date().toISOString().slice(0, 10)}`;
}

// True when today's recorded OpenAI token usage has already reached the
// budget. Best-effort: returns false (allow) if no store or on any error, so
// the product never hard-fails just because the counter is unavailable.
export async function dailyBudgetExhausted(): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    const used = await r.get<number>(todayKey());
    return typeof used === "number" && used >= DAILY_TOKEN_BUDGET;
  } catch {
    return false;
  }
}

// Record tokens spent on an OpenAI call against today's counter. No-op without
// a store; keeps a 2-day TTL so the key self-expires.
export async function recordTokens(tokens: number): Promise<void> {
  if (!tokens || tokens <= 0) return;
  const r = getRedis();
  if (!r) return;
  try {
    const key = todayKey();
    const total = await r.incrby(key, Math.round(tokens));
    if (total === Math.round(tokens)) await r.expire(key, 60 * 60 * 48);
  } catch {
    // best-effort accounting only
  }
}

// Prefer the platform-provided connecting IP (Vercel sets x-real-ip to the
// actual edge peer) over the left-most x-forwarded-for hop, which the client
// can spoof.
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || "unknown";
}
