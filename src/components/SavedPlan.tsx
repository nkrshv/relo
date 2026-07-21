"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChecklistView from "@/components/ChecklistView";
import { track } from "@/lib/analytics";
import { isDevUnlocked, markDevUnlocked } from "@/lib/unlock";
import type { ReloInput, ReloPlan, VisaSummary } from "@/lib/types";

interface Props {
  slug: string;
  input: ReloInput;
  plan: ReloPlan;
  visa: VisaSummary | null;
  paid: boolean;
  shareUrl: string;
}

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_ATTEMPTS = 12; // ~30s of confirming before we fall back to email

// Renders a plan opened by its permanent link. Unlock is driven by the
// server-verified `paid` flag — the single source of truth. Returning from
// checkout with ?paid=1 does NOT unlock on its own; instead we poll the plan
// API until the verified webhook has flipped `paid`, which also covers the
// race where the buyer lands before the webhook arrives.
export default function SavedPlan({
  slug,
  input,
  plan,
  visa,
  paid,
  shareUrl,
}: Props) {
  const router = useRouter();
  // The SSR page only sends the free preview for an unpaid plan; once payment
  // is confirmed we swap in the full plan the poll returns, so unlocking
  // reveals the real phases without a full reload.
  const [planState, setPlanState] = useState(plan);
  const [unlocked, setUnlocked] = useState(paid);
  const [unlocking, setUnlocking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track("Plan Page Viewed");
  }, []);

  useEffect(() => {
    if (paid) return;

    const params = new URLSearchParams(window.location.search);
    const returnedFromCheckout = params.get("paid") === "1";

    if (!returnedFromCheckout) {
      // Dev-unlock fallback (only ever set when payments aren't configured),
      // scoped to this plan's slug so it never leaks to other plans.
      if (isDevUnlocked(slug)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUnlocked(true);
      }
      return;
    }

    setConfirming(true);
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/plan/${slug}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as {
            paid?: boolean;
            plan?: ReloPlan;
          };
          if (data.paid) {
            if (!cancelled) {
              if (data.plan) setPlanState(data.plan);
              setUnlocked(true);
              setConfirming(false);
              track("Plan Unlocked");
              window.history.replaceState({}, "", window.location.pathname);
            }
            return;
          }
        }
      } catch {
        // network hiccup — keep polling
      }
      if (cancelled) return;
      if (attempts >= POLL_MAX_ATTEMPTS) {
        setConfirming(false);
        setError(
          "Payment received. Unlocking can take a minute — we've emailed your permanent link, or refresh this page shortly.",
        );
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    timer = setTimeout(poll, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paid, slug]);

  const unlock = useCallback(async () => {
    setUnlocking(true);
    setError(null);
    track("Unlock Clicked");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = (await res.json()) as {
        url?: string;
        devUnlock?: boolean;
        error?: string;
      };
      if (data.devUnlock) {
        markDevUnlocked(slug);
        setUnlocked(true);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Couldn't start checkout.");
    } catch {
      setError("Network error starting checkout.");
    } finally {
      setUnlocking(false);
    }
  }, [slug]);

  const reset = useCallback(() => {
    router.push("/plan");
  }, [router]);

  return (
    <div className="rise">
      {confirming && (
        <p className="mx-auto mb-4 flex max-w-3xl items-center gap-2 rounded-lg bg-stone-50 px-4 py-2 text-sm text-stone-600">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
          Confirming your payment…
        </p>
      )}
      {error && (
        <p className="mx-auto mb-4 max-w-3xl rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {error}
        </p>
      )}
      <ChecklistView
        input={input}
        plan={planState}
        visa={visa}
        unlocked={unlocked}
        unlocking={unlocking}
        onUnlock={unlock}
        onReset={reset}
        shareUrl={shareUrl}
        slug={slug}
      />
    </div>
  );
}
