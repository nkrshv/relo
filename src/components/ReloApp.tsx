"use client";

import { useCallback, useEffect, useState } from "react";
import ReloForm from "@/components/ReloForm";
import ChecklistView from "@/components/ChecklistView";
import PlanSkeleton from "@/components/PlanSkeleton";
import StageStepper from "@/components/StageStepper";
import { ALL_COUNTRIES, isValidCountry } from "@/lib/allCountries";
import { normalizeName } from "@/lib/countryFacts";
import { track } from "@/lib/analytics";
import { isDevUnlocked, markDevUnlocked } from "@/lib/unlock";
import type { ReloInput, ReloPlan, VisaSummary } from "@/lib/types";

interface Props {
  initialTo?: string;
  initialFrom?: string;
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
  /** Permanent slug when the plan was persisted server-side. */
  slug?: string;
}

const RESULT_KEY = "relochecklist:result";

export default function ReloApp({ initialTo, initialFrom, showHeading }: Props) {
  const [result, setResult] = useState<StoredResult | null>(null);
  const [route, setRoute] = useState({
    from: initialFrom ?? "",
    to: initialTo ?? "",
    fromCity: "",
    toCity: "",
  });
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fire the top-of-funnel view once on the /plan page.
  useEffect(() => {
    if (showHeading) track("Plan Page Viewed");
  }, [showHeading]);

  // Restore prior session. Unlock is scoped to the restored plan's own slug,
  // never a browser-wide flag, so an unrelated plan never inherits access.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RESULT_KEY);
      if (raw) {
        const restored = JSON.parse(raw) as StoredResult;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setResult(restored);
        if (restored.slug) {
          setShareUrl(`${window.location.origin}/plan/${restored.slug}`);
        }
        if (isDevUnlocked(restored.slug)) {
          setUnlocked(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const generate = useCallback(async (input: ReloInput) => {
    setLoading(true);
    setError(null);
    // Only non-PII route/profile fields; free-text budget/notes are excluded.
    track("Plan Generation Started", {
      fromCountry: input.fromCountry,
      toCountry: input.toCountry,
      profile: input.profile,
    });
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
        track("Plan Generation Failed", {
          status_code: res.status,
          error_type:
            res.status === 429
              ? "rate_limited"
              : res.status === 503
                ? "unavailable"
                : "server_error",
        });
        setError(
          ("error" in data && data.error) ||
            "Something went wrong generating your plan.",
        );
        setLoading(false);
        return;
      }
      track("Plan Generation Succeeded");
      // A freshly generated plan is unpaid; only its own slug can unlock it.
      setUnlocked(isDevUnlocked(data.slug));
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
        // Promote the plan to its permanent URL so a refresh (or a shared
        // link) resolves to the saved copy on the server.
        if (data.slug) {
          const url = `/plan/${data.slug}`;
          window.history.replaceState({}, "", url);
          setShareUrl(`${window.location.origin}${url}`);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        setLoading(false);
        setFinishing(false);
      }, 1600);
    } catch {
      track("Plan Generation Failed", { error_type: "network" });
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }, []);

  const unlock = useCallback(async () => {
    setUnlocking(true);
    setError(null);
    track("Unlock Clicked");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: result?.slug }),
      });
      const data = (await res.json()) as {
        url?: string;
        devUnlock?: boolean;
        error?: string;
      };
      if (data.devUnlock) {
        markDevUnlocked(result?.slug);
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
  }, [result]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setShareUrl(null);
    setUnlocked(false);
    try {
      localStorage.removeItem(RESULT_KEY);
    } catch {
      // ignore
    }
    // Back to the empty form URL so the next plan mints a fresh link.
    if (window.location.pathname !== "/plan") {
      window.history.replaceState({}, "", "/plan");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // The stepper stays mounted at a fixed position across all three stages,
  // so stage changes animate in place instead of remounting.
  return (
    <div className="px-4 py-6">
      {showHeading && (
        <StageStepper current={result ? 3 : loading ? 2 : 1} />
      )}
      {result ? (
        <div className="rise">
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
            shareUrl={shareUrl}
            slug={result.slug}
          />
        </div>
      ) : loading ? (
        <>
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
        </>
      ) : (
        <>
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
            initialFrom={initialFrom}
            onSubmit={generate}
            onRouteChange={(from, to, fromCity, toCity) =>
              setRoute({
                from,
                to,
                fromCity: fromCity ?? "",
                toCity: toCity ?? "",
              })
            }
          />
        </>
      )}
    </div>
  );
}
