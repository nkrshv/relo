// Per-plan dev-unlock state (client-only).
//
// Unlock must be scoped to a single plan slug, never a browser-wide flag:
// otherwise unlocking one plan would free every other plan in the same
// browser. The server-verified `paid` flag (per slug) is the real source of
// truth for real payments; this list only covers the dev-unlock fallback that
// exists when payments aren't configured.

const KEY = "relochecklist:unlockedSlugs";

export function unlockedSlugs(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

export function isDevUnlocked(slug?: string | null): boolean {
  if (!slug) return false;
  return unlockedSlugs().includes(slug);
}

export function markDevUnlocked(slug?: string | null): void {
  if (!slug) return;
  try {
    const next = new Set(unlockedSlugs());
    next.add(slug);
    localStorage.setItem(KEY, JSON.stringify([...next]));
  } catch {
    // ignore
  }
}
