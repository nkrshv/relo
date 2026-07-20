"use client";

import { useEffect, useRef, useState } from "react";

// A single status line cycles through these while the model builds the plan.
// Real checks first, then lighter quips so a longer wait stays human. Only
// one line is ever on screen; it cross-fades in place.
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
  /** Called once the finish animation has fully played out. */
  onDone?: () => void;
}

export default function PlanSkeleton({ done = false, onDone }: Props) {
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

  // Once the backend returns, let the check draw in, then fade the block out.
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setFinished(true), 700);
    return () => clearTimeout(id);
  }, [done]);

  // Hand control back to the parent when the fade-out completes, so the swap to
  // the real plan is tied to the animation instead of a magic timeout. A short
  // fallback covers browsers that skip the transitionend (e.g. reduced motion).
  const handled = useRef(false);
  const finish = () => {
    if (handled.current) return;
    handled.current = true;
    onDone?.();
  };
  useEffect(() => {
    if (!finished) return;
    const id = setTimeout(finish, 700);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const label = done ? FINAL_MESSAGE : MESSAGES[index];

  // Track the outgoing label so it can drift out while the next drifts in.
  const [prev, setPrev] = useState<string | null>(null);
  const prevLabel = useRef(label);
  useEffect(() => {
    if (prevLabel.current === label) return;
    setPrev(prevLabel.current);
    prevLabel.current = label;
    const id = setTimeout(() => setPrev(null), 300);
    return () => clearTimeout(id);
  }, [label]);

  return (
    <div
      className={`mx-auto w-full max-w-3xl reveal transition-opacity delay-150 duration-300 ${
        finished ? "opacity-0" : "opacity-100"
      }`}
      onTransitionEnd={(e) => {
        if (finished && e.propertyName === "opacity") finish();
      }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-center gap-3 py-16">
        {finished ? (
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4 shrink-0 text-emerald-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path className="draw-check" pathLength={1} d="M3.5 8.5 6.5 11.5 12.5 4.5" />
          </svg>
        ) : (
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-stone-200 border-t-stone-700" />
        )}
        <span className="relative inline-flex min-h-5 items-center">
          {prev && (
            <span
              key={prev}
              className="msg-out absolute inset-0 whitespace-nowrap text-sm font-medium text-stone-400"
              aria-hidden
            >
              {prev}
            </span>
          )}
          <span
            key={label}
            className="msg-in whitespace-nowrap text-sm font-medium text-stone-700"
            aria-live="polite"
          >
            {label}
          </span>
        </span>
      </div>
    </div>
  );
}
