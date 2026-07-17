"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  "Checking visa rules for your passport",
  "Pulling live data: FX, climate, air quality",
  "Mapping banking, tax & healthcare",
  "Personalizing to who's moving with you",
];
const FINAL_STEP = "Assembling your checklist";

// Extra "checks" that append to the list one by one while the model
// finishes the plan — the final step takes the longest, so keep the
// wait entertaining.
const QUIPS = [
  "Tasting the local coffee. Quality control, obviously",
  "Reading page 47 of the visa fine print so you never have to",
  "Asking locals where they actually buy groceries",
  "Translating bureaucratese into human",
  "Double-checking the one deadline everyone misses",
  "Locating the office that's only open Tuesdays, 9 to 11",
  "Counting how many stamps your paperwork really needs",
  "Checking if your plug fits, literally",
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

type RowState = "done" | "active" | "pending";

export default function PlanSkeleton({ done = false }: Props) {
  const [tick, setTick] = useState(0);
  const [finishChecked, setFinishChecked] = useState(false);
  const doneRef = useRef(done);
  useEffect(() => {
    doneRef.current = done;
  }, [done]);

  // Tick through the real checks, then append one quip per tick; the tick
  // freezes the moment the backend returns, so no new quips appear and the
  // final step takes over.
  useEffect(() => {
    const id = setInterval(() => {
      if (doneRef.current) return;
      setTick((t) => t + 1);
    }, 2100);
    return () => clearInterval(id);
  }, []);

  const quipCount = Math.min(
    Math.max(0, tick - STEPS.length + 1),
    QUIPS.length,
  );

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setFinishChecked(true), 900);
    return () => clearTimeout(id);
  }, [done]);

  const realChecked = done ? STEPS.length : Math.min(tick, STEPS.length);
  const rows: { label: string; state: RowState }[] = [
    ...STEPS.map((label, i) => ({
      label,
      state: (i < realChecked
        ? "done"
        : !done && i === tick
          ? "active"
          : "pending") as RowState,
    })),
    ...QUIPS.slice(0, quipCount).map((label, i) => ({
      label,
      state: (done || i < quipCount - 1 ? "done" : "active") as RowState,
    })),
    {
      label: FINAL_STEP,
      state: finishChecked ? "done" : done ? "active" : "pending",
    },
  ];

  return (
    <div
      className={`mx-auto w-full max-w-3xl reveal transition-opacity delay-150 duration-300 ${
        finishChecked ? "opacity-0" : "opacity-100"
      }`}
    >
      <ol className="mx-auto mb-8 w-full max-w-lg space-y-2" aria-live="polite">
        {rows.map(({ label, state }) => {
          const checked = state === "done";
          const active = state === "active";
          return (
            <li
              key={label}
              className={`reveal flex items-center gap-3 text-sm transition-colors duration-300 ${
                checked
                  ? "text-stone-500"
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
              {label}
              {checked && <span className="sr-only">, done</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
