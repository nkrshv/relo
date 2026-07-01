"use client";

import { useEffect, useState } from "react";
import type { ReloInput, ReloPlan } from "@/lib/types";

interface Props {
  input: ReloInput;
  plan: ReloPlan;
  unlocked: boolean;
  unlocking: boolean;
  onUnlock: () => void;
  onReset: () => void;
}

const CHECK_KEY = "relochecklist:checked";

function itemId(phaseIndex: number, itemIndex: number): string {
  return `${phaseIndex}:${itemIndex}`;
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      // ignore
    }
  }, []);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(CHECK_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const totalItems = plan.phases.reduce((n, p) => n + p.items.length, 0);
  const doneItems = Object.values(checked).filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={onReset}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Start over
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
        <p className="mt-3 text-sm text-slate-500">
          {doneItems}/{totalItems} steps done
        </p>
      </header>

      <div className="space-y-8">
        {plan.phases.map((phase, pi) => {
          const locked = !unlocked && pi > 0;
          return (
            <section key={phase.key}>
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
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggle(id)}
                            className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`font-semibold ${
                                  isChecked
                                    ? "text-slate-400 line-through"
                                    : "text-slate-900"
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                {item.category}
                              </span>
                              {item.estimate && (
                                <span className="text-xs text-slate-400">
                                  {item.estimate}
                                </span>
                              )}
                            </div>
                            {item.why && (
                              <p className="mt-1 text-sm text-slate-600">
                                {item.why}
                              </p>
                            )}
                            {item.tip && (
                              <p className="mt-1 text-sm text-indigo-700">
                                💡 {item.tip}
                              </p>
                            )}
                          </div>
                        </label>
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
        <div className="mt-10 rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center print:hidden">
          <h3 className="text-lg font-bold text-slate-900">
            Unlock your full relocation plan
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Get every phase — first week, first month, and first 90 days — with
            all personalized steps, tips, and cost estimates.
          </p>
          <button
            onClick={onUnlock}
            disabled={unlocking}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {unlocking ? "Redirecting…" : "Unlock full plan — $9"}
          </button>
        </div>
      )}
    </div>
  );
}
