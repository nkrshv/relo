"use client";

import { useEffect, useState } from "react";

const PHASES = ["Before you go", "First week", "First month", "First 90 days"];
const STEPS = [
  "Checking visa rules for your passport",
  "Pulling live data: FX, climate, air quality",
  "Mapping banking, tax & healthcare",
  "Personalizing to who's moving with you",
  "Assembling your checklist",
];

// Rotating status lines while the model finishes the plan — the last
// step takes the longest, so keep the wait entertaining.
const QUIPS = [
  "Tasting the local coffee — quality control, obviously",
  "Reading page 47 of the visa fine print so you never have to",
  "Asking locals where they actually buy groceries",
  "Translating bureaucratese into human",
  "Double-checking the one deadline everyone misses",
  "Locating the office that's only open Tuesdays, 9 to 11",
  "Counting how many stamps your paperwork really needs",
  "Checking if your plug fits — literally",
  "Negotiating with the visa gods on your behalf",
  "Stress-testing your budget against real rents",
  "Figuring out which SIM card locals actually use",
  "Sorting the steps so nothing blocks anything else",
  "Practicing 'where is the bathroom?' in the local language",
  "Polishing your checklist until it squeaks",
];

interface Props {
  /** The backend finished — run the final "assembling" step, then check it off. */
  done?: boolean;
}

export default function PlanSkeleton({ done = false }: Props) {
  const [tick, setTick] = useState(0);
  const [finishChecked, setFinishChecked] = useState(false);

  // Tick through the real checks; the final step only runs once the
  // backend actually returns the plan — until then the quips carry the wait.
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
    }, 2100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setFinishChecked(true), 900);
    return () => clearTimeout(id);
  }, [done]);

  const lastIndex = STEPS.length - 1;
  const checkedCount = finishChecked
    ? STEPS.length
    : done
      ? lastIndex
      : Math.min(tick, lastIndex);
  const spinnerIndex = finishChecked
    ? -1
    : done
      ? lastIndex
      : Math.min(tick, lastIndex);
  const quip =
    !done && tick >= lastIndex
      ? QUIPS[(tick - lastIndex) % QUIPS.length]
      : null;

  return (
    <div
      className={`mx-auto w-full max-w-3xl reveal transition-opacity delay-150 duration-300 ${
        finishChecked ? "opacity-0" : "opacity-100"
      }`}
    >
      <ol className="mx-auto mb-8 w-fit space-y-2" aria-live="polite">
        {STEPS.map((label, i) => {
          const checked = i < checkedCount;
          const active = i === spinnerIndex;
          const isLast = i === lastIndex;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 text-sm transition-colors duration-300 ${
                checked
                  ? "text-stone-400"
                  : active
                    ? "font-medium text-stone-800"
                    : "text-stone-300"
              }`}
            >
              {checked ? (
                <svg
                  viewBox="0 0 16 16"
                  className="reveal h-4 w-4 shrink-0 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                </svg>
              ) : active ? (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-stone-200 border-t-stone-700" />
              ) : (
                <span className="mx-1 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-200" />
              )}
              {isLast && quip ? (
                <span key={quip} className="reveal font-medium text-stone-800">
                  {quip}
                </span>
              ) : (
                label
              )}
              {checked && <span className="sr-only">— done</span>}
            </li>
          );
        })}
      </ol>

      <div className="space-y-7">
        {PHASES.map((phase, pi) => (
          <section key={phase}>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-medium text-stone-400">
                {pi + 1}
              </span>
              <span className="text-lg font-semibold text-stone-300">{phase}</span>
            </div>
            <div className="space-y-3">
              {Array.from({ length: pi === 0 ? 3 : 2 }).map((_, ii) => (
                <div
                  key={ii}
                  className="rounded-lg border border-stone-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="skeleton mt-1 h-5 w-5 shrink-0 rounded" />
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div className="skeleton h-4 w-2/5 rounded" />
                      <div className="skeleton h-3 w-full rounded" />
                      <div className="skeleton h-3 w-4/5 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
