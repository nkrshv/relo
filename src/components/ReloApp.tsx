"use client";

import { useCallback, useEffect, useState } from "react";
import ReloForm from "@/components/ReloForm";
import ChecklistView from "@/components/ChecklistView";
import PlanSkeleton from "@/components/PlanSkeleton";
import StageStepper from "@/components/StageStepper";
import { ALL_COUNTRIES, isValidCountry } from "@/lib/allCountries";
import { normalizeName } from "@/lib/countryFacts";
import type { ReloInput, ReloPlan, VisaSummary } from "@/lib/types";

interface Props {
  initialTo?: string;
  /** Render the page heading, morphing into the route once both countries are picked. */
  showHeading?: boolean;
}

const COUNTRY_BY_NORM: Record<string, { name: string; emoji: string }> =
  Object.fromEntries(
    ALL_COUNTRIES.map((c) => [
      normalizeName(c.name),
      { name: c.name, emoji: c.emoji },
    ]),
  );

// The heading becomes the route itself once we know it ("Philippines →
// Netherlands"), so snapshot cells below can say just "vs home".
function RouteHeading({
  from,
  to,
  fromCity,
  toCity,
  building,
}: {
  from: string;
  to: string;
  fromCity?: string;
  toCity?: string;
  building: boolean;
}) {
  const fromC = isValidCountry(from)
    ? COUNTRY_BY_NORM[normalizeName(from)]
    : null;
  const toC = isValidCountry(to) ? COUNTRY_BY_NORM[normalizeName(to)] : null;
  const hasRoute = Boolean(fromC && toC);
  const fromLabel = fromCity?.trim() || fromC?.name;
  const toLabel = toCity?.trim() || toC?.name;
  return (
    <header className="mx-auto max-w-3xl pb-8 text-center">
      <h1
        key={hasRoute ? `${fromLabel}-${toLabel}` : "default"}
        className="reveal text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl"
      >
        {hasRoute ? (
          <>
            <span className="mr-2" aria-hidden>
              {fromC!.emoji}
            </span>
            {fromLabel}
            <span className="mx-3 font-normal text-stone-300" aria-hidden>
              →
            </span>
            <span className="mr-2" aria-hidden>
              {toC!.emoji}
            </span>
            {toLabel}
          </>
        ) : (
          "Build your relocation plan"
        )}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
        {building
          ? "Building your plan… grounding it in official data for your route."
          : hasRoute
            ? "Building your next chapter. Every detail below tunes the checklist to this route."
            : "The more you tell us, the more specific your plan gets. Visa status, kids, pets, budget: every detail changes the checklist."}
      </p>
    </header>
  );
}

interface StoredResult {
  input: ReloInput;
  plan: ReloPlan;
  visa?: VisaSummary | null;
}

const RESULT_KEY = "relochecklist:result";
const UNLOCK_KEY = "relochecklist:unlocked";

export default function ReloApp({ initialTo, showHeading }: Props) {
  const [result, setResult] = useState<StoredResult | null>(null);
  const [route, setRoute] = useState({
    from: "",
    to: initialTo ?? "",
    fromCity: "",
    toCity: "",
  });
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
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
        setLoading(false);
        return;
      }
      // Let the final "Assembling your checklist" step visibly complete
      // before swapping the skeleton for the real plan.
      setFinishing(true);
      setTimeout(() => {
        setResult(data);
        try {
          localStorage.setItem(RESULT_KEY, JSON.stringify(data));
        } catch {
          // ignore
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        setLoading(false);
        setFinishing(false);
      }, 1600);
    } catch {
      setError("Network error. Please try again.");
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
      <div className="rise px-4 py-10">
        {showHeading && <StageStepper current={3} />}
        {error && (
          <p className="mx-auto mb-4 max-w-3xl rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <ChecklistView
          input={result.input}
          plan={result.plan}
          visa={result.visa ?? null}
          unlocked={unlocked}
          unlocking={unlocking}
          onUnlock={unlock}
          onReset={reset}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        {showHeading && <StageStepper current={2} />}
        {showHeading && (
          <RouteHeading
            from={route.from}
            to={route.to}
            fromCity={route.fromCity}
            toCity={route.toCity}
            building
          />
        )}
        <PlanSkeleton done={finishing} />
      </div>
    );
  }

  return (
    <div className="px-4">
      {showHeading && <StageStepper current={1} />}
      {showHeading && (
        <RouteHeading
          from={route.from}
          to={route.to}
          fromCity={route.fromCity}
          toCity={route.toCity}
          building={false}
        />
      )}
      {error && (
        <p className="mx-auto mb-4 max-w-2xl rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}
      <ReloForm
        loading={loading}
        initialTo={initialTo}
        onSubmit={generate}
        onRouteChange={(from, to, fromCity, toCity) =>
          setRoute({ from, to, fromCity: fromCity ?? "", toCity: toCity ?? "" })
        }
      />
    </div>
  );
}
