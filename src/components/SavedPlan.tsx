"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChecklistView from "@/components/ChecklistView";
import { track } from "@/lib/analytics";
import type { ReloInput, ReloPlan, VisaSummary } from "@/lib/types";

interface Props {
  input: ReloInput;
  plan: ReloPlan;
  visa: VisaSummary | null;
  paid: boolean;
  shareUrl: string;
}

const UNLOCK_KEY = "relochecklist:unlocked";

// Renders a plan opened by its permanent link. Access is driven by the
// server-verified `paid` flag; the localStorage/query fallbacks keep the
// current (pre-payment-webhook) unlock behavior working.
export default function SavedPlan({
  input,
  plan,
  visa,
  paid,
  shareUrl,
}: Props) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(paid);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track("Plan Page Viewed");
    if (paid) return;
    const params = new URLSearchParams(window.location.search);
    const fromQuery =
      params.get("paid") === "1" || params.get("unlocked") === "1";
    let stored = false;
    try {
      stored = localStorage.getItem(UNLOCK_KEY) === "1";
    } catch {
      // ignore
    }
    if (fromQuery || stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnlocked(true);
      if (fromQuery) {
        try {
          localStorage.setItem(UNLOCK_KEY, "1");
        } catch {
          // ignore
        }
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [paid]);

  const unlock = useCallback(async () => {
    setUnlocking(true);
    setError(null);
    track("Unlock Clicked");
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = (await res.json()) as {
        url?: string;
        devUnlock?: boolean;
        error?: string;
      };
      if (data.devUnlock) {
        setUnlocked(true);
        try {
          localStorage.setItem(UNLOCK_KEY, "1");
        } catch {
          // ignore
        }
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
  }, []);

  const reset = useCallback(() => {
    router.push("/plan");
  }, [router]);

  return (
    <div className="rise">
      {error && (
        <p className="mx-auto mb-4 max-w-3xl rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <ChecklistView
        input={input}
        plan={plan}
        visa={visa}
        unlocked={unlocked}
        unlocking={unlocking}
        onUnlock={unlock}
        onReset={reset}
        shareUrl={shareUrl}
      />
    </div>
  );
}
