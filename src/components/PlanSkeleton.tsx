"use client";

import { useEffect, useRef, useState } from "react";

// A single status line cycles through these while the model builds the plan.
// Real checks first, then lighter quips so a longer wait stays human. Only
// one line is ever on screen; it swaps in place.
const MESSAGES = [
  "Checking visa rules for your passport",
  "Pulling live data: FX, climate, air quality",
  "Mapping banking, tax & healthcare",
  "Personalizing to who's moving with you",
  "Reading page 47 of the visa fine print so you never have to",
  "Asking locals where they actually buy groceries",
  "Translating bureaucratese into human",
  "Double-checking the one deadline everyone misses",
  "Locating the office that's only open Tuesdays, 9 to 11",
  "Counting how many stamps your paperwork really needs",
  "Stress-testing your budget against real rents",
  "Sorting the steps so nothing blocks anything else",
  "Polishing your checklist until it squeaks",
];
const FINAL_MESSAGE = "Assembling your checklist";

interface Props {
  /** The backend finished — show the final line, check it off, then fade out. */
  done?: boolean;
}

export default function PlanSkeleton({ done = false }: Props) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const doneRef = useRef(done);
  useEffect(() => {
    doneRef.current = done;
  }, [done]);

  // Advance the single line while we wait; freeze the moment the backend
  // returns so the final message can take over cleanly.
  useEffect(() => {
    const id = setInterval(() => {
      if (doneRef.current) return;
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 2100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setFinished(true), 700);
    return () => clearTimeout(id);
  }, [done]);

  const label = done ? FINAL_MESSAGE : MESSAGES[index];

  return (
    <div
      className={`mx-auto w-full max-w-3xl reveal transition-opacity delay-150 duration-300 ${
        finished ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="mx-auto flex max-w-lg items-center justify-center gap-3 py-16">
        {finished ? (
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
        ) : (
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-stone-200 border-t-stone-700" />
        )}
        <p
          key={label}
          className="reveal text-sm font-medium text-stone-700"
          aria-live="polite"
        >
          {label}
        </p>
      </div>
    </div>
  );
}
