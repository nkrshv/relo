"use client";

import { useCallback, useEffect, useState } from "react";
import ReloForm from "@/components/ReloForm";
import ChecklistView from "@/components/ChecklistView";
import type { ReloInput, ReloPlan } from "@/lib/types";

interface Props {
  initialTo?: string;
}

interface StoredResult {
  input: ReloInput;
  plan: ReloPlan;
}

const RESULT_KEY = "relochecklist:result";
const UNLOCK_KEY = "relochecklist:unlocked";

export default function ReloApp({ initialTo }: Props) {
  const [result, setResult] = useState<StoredResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore prior session + handle unlock redirect from Stripe.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RESULT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setResult(JSON.parse(raw) as StoredResult);
    } catch {
      // ignore
    }
    const params = new URLSearchParams(window.location.search);
    const wasUnlocked = params.get("unlocked") === "1";
    const stored = localStorage.getItem(UNLOCK_KEY) === "1";
    if (wasUnlocked || stored) {
      setUnlocked(true);
      try {
        localStorage.setItem(UNLOCK_KEY, "1");
      } catch {
        // ignore
      }
      if (wasUnlocked) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  const generate = useCallback(async (input: ReloInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as
        | StoredResult
        | { error?: string };
      if (!res.ok || !("plan" in data)) {
        setError(
          ("error" in data && data.error) ||
            "Something went wrong generating your plan.",
        );
        return;
      }
      setResult(data);
      try {
        localStorage.setItem(RESULT_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const unlock = useCallback(async () => {
    setUnlocking(true);
    setError(null);
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
    setResult(null);
    setError(null);
    try {
      localStorage.removeItem(RESULT_KEY);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (result) {
    return (
      <div className="px-4 py-10">
        {error && (
          <p className="mx-auto mb-4 max-w-3xl rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <ChecklistView
          input={result.input}
          plan={result.plan}
          unlocked={unlocked}
          unlocking={unlocking}
          onUnlock={unlock}
          onReset={reset}
        />
      </div>
    );
  }

  return (
    <div className="px-4">
      {error && (
        <p className="mx-auto mb-4 max-w-2xl rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}
      <ReloForm loading={loading} initialTo={initialTo} onSubmit={generate} />
    </div>
  );
}
