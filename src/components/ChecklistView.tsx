"use client";

import { useEffect, useRef, useState } from "react";
import type { ReloInput, ReloPlan } from "@/lib/types";
import CountrySummary from "@/components/CountrySummary";

interface Props {
  input: ReloInput;
  plan: ReloPlan;
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

// Colour-codes step categories so the eye can group related tasks at a glance.
const CATEGORY_STYLES: Record<string, { chip: string; bar: string }> = {
  residency: { chip: "bg-indigo-50 text-indigo-700 ring-indigo-200/70", bar: "bg-indigo-400" },
  visa: { chip: "bg-indigo-50 text-indigo-700 ring-indigo-200/70", bar: "bg-indigo-400" },
  healthcare: { chip: "bg-rose-50 text-rose-700 ring-rose-200/70", bar: "bg-rose-400" },
  health: { chip: "bg-rose-50 text-rose-700 ring-rose-200/70", bar: "bg-rose-400" },
  banking: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-200/70", bar: "bg-emerald-400" },
  finance: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-200/70", bar: "bg-emerald-400" },
  housing: { chip: "bg-amber-50 text-amber-700 ring-amber-200/70", bar: "bg-amber-400" },
  taxes: { chip: "bg-violet-50 text-violet-700 ring-violet-200/70", bar: "bg-violet-400" },
  tax: { chip: "bg-violet-50 text-violet-700 ring-violet-200/70", bar: "bg-violet-400" },
  logistics: { chip: "bg-sky-50 text-sky-700 ring-sky-200/70", bar: "bg-sky-400" },
};

const DEFAULT_CATEGORY_STYLE = {
  chip: "bg-slate-50 text-slate-600 ring-slate-200/70",
  bar: "bg-slate-300",
};

function categoryStyle(category: string) {
  return CATEGORY_STYLES[category.trim().toLowerCase()] ?? DEFAULT_CATEGORY_STYLE;
}

function milestoneCopy(pct: number): string {
  if (pct === 0) return "Ready when you are — start with the first step.";
  if (pct < 25) return "Great start — momentum matters more than speed.";
  if (pct < 50) return "Solid progress — the hardest steps are behind you soon.";
  if (pct < 75) return "Over halfway there — keep it rolling.";
  if (pct < 100) return "Almost done — just a few steps left.";
  return "Everything checked off. Enjoy your new home! 🎉";
}

// Animated circular checkbox with a springy pop on check.
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
      className={`group/check mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200 ${
        checked
          ? "border-indigo-600 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-600/30"
          : "border-slate-300 bg-white hover:border-indigo-400 hover:shadow-sm"
      }`}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-3.5 w-3.5 text-white transition-all duration-200 ${
          checked ? "check-pop opacity-100" : "scale-0 opacity-0"
        }`}
        aria-hidden
      >
        <path d="M4 10.5l4 4 8-8.5" />
      </svg>
    </button>
  );
}

// Lightweight CSS confetti burst rendered inside the completion card.
function Confetti() {
  const pieces = Array.from({ length: 14 });
  const colors = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i * 100) / pieces.length + 3}%`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${(i % 7) * 0.12}s`,
            transform: `rotate(${(i * 47) % 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function ChecklistView({
  input,
  plan,
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
          className="text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
        >
          ← Start over
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700 backdrop-blur transition hover:border-indigo-300 hover:text-indigo-700"
          >
            Print / PDF
          </button>
        </div>
      </div>

      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          {input.fromCountry} → {input.toCountry}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Your relocation plan
        </h1>
        {plan.destinationSummary && (
          <p className="mt-3 text-slate-600">{plan.destinationSummary}</p>
        )}
        {plan.feasibility && (
          <div
            role="alert"
            className={`reveal mt-5 flex items-start gap-3 rounded-2xl border p-4 ${
              plan.feasibility.level === "blocked"
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <span className="mt-0.5 text-lg leading-none" aria-hidden>
              {plan.feasibility.level === "blocked" ? "⛔" : "⚠️"}
            </span>
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
        />
      </header>

      {/* Progress rail: sticks to the top while working through the list. */}
      <div className="sticky top-3 z-20 mb-8 print:hidden">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-md">
          <div className="relative h-10 w-10 shrink-0">
            <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90" aria-hidden>
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                strokeWidth="4"
                className="stroke-slate-100"
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
                  allDone ? "stroke-emerald-500" : "stroke-indigo-500"
                }`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
              {pct}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-slate-800">
                {doneItems}/{totalItems} steps done
              </p>
              <p className="hidden text-xs text-slate-400 sm:block">
                {input.fromCountry} → {input.toCountry}
              </p>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {milestoneCopy(pct)}
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                  allDone
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : "bg-gradient-to-r from-indigo-500 to-violet-600"
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
          className="reveal relative mb-8 flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <Confetti />
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
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
              <p className="font-bold text-emerald-900">
                Plan complete — you did it! 🎉
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
              className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Print / PDF
            </button>
            <button
              onClick={onReset}
              className="rounded-lg border border-emerald-300 bg-white/70 px-3.5 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-white"
            >
              New plan
            </button>
          </div>
        </div>
      )}

      {/* Journey timeline: a vertical rail connects the phases of the move. */}
      <div className="relative space-y-10 pl-10 sm:pl-12">
        <div
          className="absolute bottom-4 left-[15px] top-1 w-px bg-gradient-to-b from-indigo-200 via-slate-200 to-slate-100 sm:left-[19px] print:hidden"
          aria-hidden
        />
        {plan.phases.map((phase, pi) => {
          const locked = !unlocked && pi > 0;
          const phaseDone = phase.items.filter((_, ii) => checked[itemId(pi, ii)]).length;
          const phaseComplete = phase.items.length > 0 && phaseDone >= phase.items.length;
          return (
            <section key={phase.key} className={locked ? "print:hidden" : ""}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                <span
                  className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-4 ring-[#fbfbfd] transition-colors duration-300 sm:h-10 sm:w-10 ${
                    phaseComplete
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                      : locked
                        ? "bg-slate-100 text-slate-400"
                        : "bg-indigo-100 text-indigo-700"
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
                  <span className="ml-1 text-xs font-medium text-slate-400">
                    🔒 locked
                  </span>
                ) : (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 print:hidden ${
                      phaseComplete
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-50 text-slate-500 ring-slate-200"
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
                    const cat = categoryStyle(item.category);
                    return (
                      <li
                        key={id}
                        className={`reveal relative overflow-hidden rounded-2xl border bg-white/70 shadow-sm backdrop-blur transition-all duration-300 ${
                          isChecked
                            ? "border-slate-200/50 opacity-70"
                            : isNext
                              ? "border-indigo-300 shadow-md shadow-indigo-600/5 ring-1 ring-indigo-200"
                              : "border-slate-200/70 hover:border-indigo-200 hover:shadow-md"
                        } ${isChecked ? "p-3" : "p-4"}`}
                        style={{ animationDelay: `${ii * 60}ms` }}
                      >
                        <span
                          className={`absolute inset-y-0 left-0 w-1 transition-opacity duration-300 ${cat.bar} ${
                            isChecked ? "opacity-30" : "opacity-70"
                          }`}
                          aria-hidden
                        />
                        {isNext && (
                          <span className="absolute right-3 top-3 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm print:hidden">
                            Up next
                          </span>
                        )}
                        <div className="flex items-start gap-3 pl-1.5">
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
                                className={`block font-semibold leading-snug transition-colors duration-300 ${
                                  isChecked
                                    ? "text-slate-400 line-through"
                                    : "text-slate-900"
                                } ${isNext ? "pr-16" : ""}`}
                              >
                                {item.title}
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${cat.chip}`}
                                >
                                  {item.category}
                                </span>
                                {item.estimate && <span>{item.estimate}</span>}
                              </span>
                              {!isChecked && item.why && (
                                <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">
                                  {item.why}
                                </span>
                              )}
                            </label>
                            {!isChecked && item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex max-w-full items-center gap-1 text-xs font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 transition hover:text-indigo-800 hover:decoration-indigo-500"
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
                            {!isChecked && item.tip && (
                              <details className="group/tip mt-2">
                                <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-800 [&::-webkit-details-marker]:hidden">
                                  <span aria-hidden>💡</span> Tip
                                  <span className="text-slate-400 transition group-open/tip:rotate-180">
                                    ⌄
                                  </span>
                                </summary>
                                <p className="mt-1.5 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-sm leading-relaxed text-slate-600">
                                  {item.tip}
                                </p>
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
                    <div className="pointer-events-auto rounded-xl border border-slate-200 bg-white/90 p-4 text-center shadow-lg backdrop-blur">
                      <p className="text-sm font-medium text-slate-700">
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
        <div className="reveal mt-10 overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 to-violet-50 p-8 text-center shadow-sm print:hidden">
          <h3 className="text-xl font-bold text-slate-900">
            Unlock your full relocation plan
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Get every phase — first week, first month, and first 90 days — with
            all personalized steps, tips, and cost estimates.
          </p>
          <button
            onClick={onUnlock}
            disabled={unlocking}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-600/35 active:scale-[0.99] disabled:opacity-50"
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
