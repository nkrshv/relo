"use client";

import { useEffect, useRef, useState } from "react";
import type { ReloInput, ReloPlan, VisaSummary } from "@/lib/types";
import CountrySummary from "@/components/CountrySummary";

interface Props {
  input: ReloInput;
  plan: ReloPlan;
  visa?: VisaSummary | null;
  unlocked: boolean;
  unlocking: boolean;
  onUnlock: () => void;
  onReset: () => void;
}

const CHECK_KEY_PREFIX = "relochecklist:checked";

function itemId(phaseIndex: number, itemIndex: number): string {
  return `${phaseIndex}:${itemIndex}`;
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function prettyHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "official site";
  }
}

function planStorageKey(input: ReloInput, plan: ReloPlan): string {
  const signature = [
    input.fromCountry,
    input.toCountry,
    input.profile,
    plan.destinationSummary,
    ...plan.phases.flatMap((p) => p.items.map((it) => it.title)),
  ].join("|");
  return `${CHECK_KEY_PREFIX}:${hashString(signature)}`;
}

// A small coloured dot is the only per-category colour signal.
const CATEGORY_DOTS: Record<string, string> = {
  residency: "bg-indigo-500",
  visa: "bg-indigo-500",
  healthcare: "bg-rose-500",
  health: "bg-rose-500",
  banking: "bg-emerald-500",
  finance: "bg-emerald-500",
  housing: "bg-amber-500",
  taxes: "bg-violet-500",
  tax: "bg-violet-500",
  logistics: "bg-sky-500",
};

function categoryDot(category: string) {
  return CATEGORY_DOTS[category.trim().toLowerCase()] ?? "bg-zinc-400";
}

function milestoneCopy(pct: number): string {
  if (pct === 0) return "Ready when you are — start with the first step.";
  if (pct < 25) return "Great start — momentum matters more than speed.";
  if (pct < 50) return "Solid progress — the hardest steps are behind you soon.";
  if (pct < 75) return "Over halfway there — keep it rolling.";
  if (pct < 100) return "Almost done — just a few steps left.";
  return "Everything checked off. Enjoy your new home.";
}

// Rounded-square checkbox in the Linear/Notion vein.
function CheckToggle({
  id,
  checked,
  onToggle,
}: {
  id: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      id={id}
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded border transition-colors ${
        checked
          ? "border-zinc-900 bg-zinc-900"
          : "border-zinc-300 bg-white hover:border-zinc-400"
      }`}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-3 w-3 text-white transition-opacity duration-150 ${
          checked ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      >
        <path d="M4 10.5l4 4 8-8.5" />
      </svg>
    </button>
  );
}

export default function ChecklistView({
  input,
  plan,
  visa,
  unlocked,
  unlocking,
  onUnlock,
  onReset,
}: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const storageKey = planStorageKey(input, plan);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecked(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});
    } catch {
       
      setChecked({});
    }
  }, [storageKey]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const totalItems = plan.phases.reduce((n, p) => n + p.items.length, 0);
  const doneItems = plan.phases.reduce(
    (n, p, pi) =>
      n + p.items.filter((_, ii) => checked[itemId(pi, ii)]).length,
    0,
  );
  const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
  const allDone = totalItems > 0 && doneItems >= totalItems;

  useEffect(() => {
    if (allDone) {
      doneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [allDone]);

  // First unchecked step in an unlocked phase gets the "Up next" spotlight.
  let nextId: string | null = null;
  outer: for (let pi = 0; pi < plan.phases.length; pi++) {
    if (!unlocked && pi > 0) break;
    for (let ii = 0; ii < plan.phases[pi].items.length; ii++) {
      if (!checked[itemId(pi, ii)]) {
        nextId = itemId(pi, ii);
        break outer;
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl reveal">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={onReset}
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          ← Start over
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            Print / PDF
          </button>
        </div>
      </div>

      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {input.fromCountry} → {input.toCountry}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Your relocation plan
        </h1>
        {plan.destinationSummary && (
          <p className="mt-3 text-zinc-600">{plan.destinationSummary}</p>
        )}
        {plan.feasibility && (
          <div
            role="alert"
            className={`reveal mt-5 flex items-start gap-3 rounded-lg border p-4 ${
              plan.feasibility.level === "blocked"
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                plan.feasibility.level === "blocked"
                  ? "text-red-500"
                  : "text-amber-500"
              }`}
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625l6.28-10.875ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
            <div className="min-w-0">
              <p
                className={`text-sm font-semibold ${
                  plan.feasibility.level === "blocked"
                    ? "text-red-800"
                    : "text-amber-800"
                }`}
              >
                {plan.feasibility.level === "blocked"
                  ? "This move may not be possible right now"
                  : "Important restrictions to check first"}
              </p>
              {plan.feasibility.note && (
                <p
                  className={`mt-1 text-sm ${
                    plan.feasibility.level === "blocked"
                      ? "text-red-700"
                      : "text-amber-700"
                  }`}
                >
                  {plan.feasibility.note}
                </p>
              )}
            </div>
          </div>
        )}
        <CountrySummary
          country={input.toCountry}
          profile={input.profile}
          fromCountry={input.fromCountry}
          visa={visa ?? null}
        />
      </header>

      {/* Progress rail: sticks to the top while working through the list. */}
      <div className="sticky top-3 z-20 mb-8 print:hidden">
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <div className="relative h-10 w-10 shrink-0">
            <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90" aria-hidden>
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                strokeWidth="4"
                className="stroke-zinc-100"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 16}
                strokeDashoffset={2 * Math.PI * 16 * (1 - pct / 100)}
                className={`transition-[stroke-dashoffset] duration-500 ease-out ${
                  allDone ? "stroke-emerald-500" : "stroke-zinc-900"
                }`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums text-zinc-700">
              {pct}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-zinc-800">
                {doneItems}/{totalItems} steps done
              </p>
              <p className="hidden text-xs text-zinc-400 sm:block">
                {input.fromCountry} → {input.toCountry}
              </p>
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {milestoneCopy(pct)}
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                  allDone ? "bg-emerald-500" : "bg-zinc-900"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {allDone && (
        <div
          ref={doneRef}
          className="reveal relative mb-8 flex flex-col items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.3 3.29 6.8-6.8a1 1 0 0 1 1.4 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-emerald-900">
                Plan complete
              </p>
              <p className="mt-0.5 text-sm text-emerald-700">
                All {totalItems} steps checked off. Save a copy for your
                records or start a plan for another move.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
            >
              Print / PDF
            </button>
            <button
              onClick={onReset}
              className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              New plan
            </button>
          </div>
        </div>
      )}

      {/* Journey timeline: a vertical rail connects the phases of the move. */}
      <div className="relative space-y-10 pl-10 sm:pl-12">
        <div
          className="absolute bottom-4 left-[15px] top-1 w-px bg-zinc-200 sm:left-[19px] print:hidden"
          aria-hidden
        />
        {plan.phases.map((phase, pi) => {
          const locked = !unlocked && pi > 0;
          const phaseDone = phase.items.filter((_, ii) => checked[itemId(pi, ii)]).length;
          const phaseComplete = phase.items.length > 0 && phaseDone >= phase.items.length;
          return (
            <section key={phase.key} className={locked ? "print:hidden" : ""}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900">
                <span
                  className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ring-4 ring-[#fafafa] transition-colors duration-300 sm:h-10 sm:w-10 ${
                    phaseComplete
                      ? "bg-emerald-600 text-white"
                      : locked
                        ? "border border-zinc-200 bg-white text-zinc-300"
                        : "border border-zinc-300 bg-white text-zinc-600"
                  }`}
                >
                  {phaseComplete ? (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.3 3.29 6.8-6.8a1 1 0 0 1 1.4 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    pi + 1
                  )}
                </span>
                {phase.title}
                {locked ? (
                  <span className="ml-1 text-xs font-medium text-zinc-400">
                    Locked
                  </span>
                ) : (
                  <span
                    className={`ml-1 text-xs font-medium tabular-nums print:hidden ${
                      phaseComplete ? "text-emerald-600" : "text-zinc-400"
                    }`}
                  >
                    {phaseDone}/{phase.items.length}
                  </span>
                )}
              </h2>

              <div className={locked ? "relative" : ""}>
                <ul
                  className={`space-y-3 ${
                    locked ? "pointer-events-none select-none blur-sm" : ""
                  }`}
                  aria-hidden={locked}
                >
                  {phase.items.map((item, ii) => {
                    const id = itemId(pi, ii);
                    const isChecked = !!checked[id];
                    const isNext = !locked && id === nextId;
                    return (
                      <li
                        key={id}
                        className={`relative rounded-lg border bg-white transition-colors duration-150 ${
                          isChecked
                            ? "border-zinc-200 opacity-60"
                            : isNext
                              ? "border-zinc-400"
                              : "border-zinc-200 hover:border-zinc-300"
                        } ${isChecked ? "p-3" : "p-4"}`}
                      >
                        {isNext && (
                          <span className="absolute right-3 top-3 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 print:hidden">
                            Up next
                          </span>
                        )}
                        <div className="flex items-start gap-3">
                          <CheckToggle
                            id={id}
                            checked={isChecked}
                            onToggle={() => toggle(id)}
                          />
                          <div className="min-w-0 flex-1">
                            <label
                              className="block cursor-pointer"
                              onClick={() => toggle(id)}
                            >
                              <span
                                className={`block text-sm font-medium leading-snug transition-colors duration-150 ${
                                  isChecked
                                    ? "text-zinc-400 line-through"
                                    : "text-zinc-900"
                                } ${isNext ? "pr-16" : ""}`}
                              >
                                {item.title}
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium capitalize text-zinc-500">
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${categoryDot(item.category)}`}
                                    aria-hidden
                                  />
                                  {item.category}
                                </span>
                                {item.estimate && <span>{item.estimate}</span>}
                                {!isChecked && item.deadline && (
                                  <span className="font-medium text-amber-700">
                                    Due: {item.deadline}
                                  </span>
                                )}
                              </span>
                              {!isChecked && item.why && (
                                <span className="mt-1.5 block text-sm leading-relaxed text-zinc-600">
                                  {item.why}
                                </span>
                              )}
                            </label>
                            {!isChecked && item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex max-w-full items-center gap-1 text-xs font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-2 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
                              >
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-3.5 w-3.5 shrink-0"
                                  aria-hidden
                                >
                                  <path d="M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5Z" />
                                  <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z" />
                                </svg>
                                <span className="truncate">
                                  {prettyHost(item.url)}
                                </span>
                              </a>
                            )}
                            {!isChecked &&
                              (item.steps?.length ||
                                item.documents?.length ||
                                item.commonMistake ||
                                item.tip) && (
                                <details className="group/tip mt-2">
                                  <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 [&::-webkit-details-marker]:hidden">
                                    {item.steps?.length ? "How to do it" : "Tip"}
                                    <svg
                                      viewBox="0 0 16 16"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-3 w-3 text-zinc-400 transition-transform group-open/tip:rotate-180"
                                      aria-hidden
                                    >
                                      <path d="M4 6l4 4 4-4" />
                                    </svg>
                                  </summary>
                                  <div className="mt-1.5 space-y-2.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-600">
                                    {item.steps && item.steps.length > 0 && (
                                      <ol className="space-y-1.5">
                                        {item.steps.map((step, si) => (
                                          <li key={si} className="flex gap-2">
                                            <span className="w-4 shrink-0 text-right text-xs font-medium tabular-nums text-zinc-400">
                                              {si + 1}.
                                            </span>
                                            <span className="min-w-0">{step}</span>
                                          </li>
                                        ))}
                                      </ol>
                                    )}
                                    {item.documents && item.documents.length > 0 && (
                                      <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                          Bring / prepare
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {item.documents.map((doc, di) => (
                                            <span
                                              key={di}
                                              className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs text-zinc-600"
                                            >
                                              {doc}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {item.commonMistake && (
                                      <p className="text-xs leading-relaxed text-zinc-600">
                                        <span className="font-medium text-rose-700">Common mistake:</span>{" "}
                                        {item.commonMistake}
                                      </p>
                                    )}
                                    {item.tip && (
                                      <p className="text-sm">{item.tip}</p>
                                    )}
                                  </div>
                                </details>
                              )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="pointer-events-auto rounded-lg border border-zinc-200 bg-white p-4 text-center shadow-sm">
                      <p className="text-sm font-medium text-zinc-700">
                        Unlock the full plan to see this phase
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {!unlocked && (
        <div className="reveal mt-10 rounded-xl border border-zinc-200 bg-white p-8 text-center print:hidden">
          <h3 className="text-xl font-semibold tracking-tight text-zinc-900">
            Unlock your full relocation plan
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
            Get every phase — first week, first month, and first 90 days — with
            all personalized steps, tips, and cost estimates.
          </p>
          <button
            onClick={onUnlock}
            disabled={unlocking}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {unlocking ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Redirecting…
              </>
            ) : (
              "Unlock full plan — $9"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
