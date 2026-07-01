"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecked(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600">Your progress</span>
            <span className="font-semibold text-indigo-600">
              {doneItems}/{totalItems} · {pct}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {allDone && (
          <div className="reveal mt-5 flex flex-col items-start gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 sm:flex-row sm:items-center sm:justify-between">
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
      </header>

      <div className="space-y-8">
        {plan.phases.map((phase, pi) => {
          const locked = !unlocked && pi > 0;
          return (
            <section key={phase.key} className={locked ? "print:hidden" : ""}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {pi + 1}
                </span>
                {phase.title}
                {locked && (
                  <span className="ml-1 text-xs font-medium text-slate-400">
                    🔒 locked
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
                    return (
                      <li
                        key={id}
                        className="reveal rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur transition-all duration-200 hover:border-indigo-200 hover:shadow-md"
                        style={{ animationDelay: `${ii * 60}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            id={id}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggle(id)}
                            className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-indigo-600 transition focus:ring-indigo-500"
                          />
                          <div className="min-w-0 flex-1">
                            <label htmlFor={id} className="block cursor-pointer">
                              <span
                                className={`block font-semibold leading-snug ${
                                  isChecked
                                    ? "text-slate-400 line-through"
                                    : "text-slate-900"
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                                <span className="font-medium uppercase tracking-wide text-slate-500">
                                  {item.category}
                                </span>
                                {item.estimate && (
                                  <>
                                    <span aria-hidden>·</span>
                                    <span>{item.estimate}</span>
                                  </>
                                )}
                              </span>
                              {item.why && (
                                <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">
                                  {item.why}
                                </span>
                              )}
                            </label>
                            {item.url && (
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
                            {item.tip && (
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
