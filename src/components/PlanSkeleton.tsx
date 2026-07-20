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

// One ghost task card. Its shell (border, padding, checkbox, two text lines)
// matches a real checklist row, so the reveal reads as the skeleton becoming
// the plan rather than a different block swapping in.
function SkeletonRow({ titleWidth }: { titleWidth: string }) {
  return (
    <li className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border border-stone-200 bg-stone-100" />
        <div className="min-w-0 flex-1">
          <span className={`skeleton block h-3.5 rounded ${titleWidth}`} />
          <span className="skeleton mt-2 block h-2.5 w-24 rounded" />
        </div>
      </div>
    </li>
  );
}

// A ghost phase: numbered node on the rail, a title bar, and a few rows.
function SkeletonPhase({
  index,
  rows,
  muted,
}: {
  index: number;
  rows: string[];
  muted?: boolean;
}) {
  return (
    <section className={muted ? "blur-[1px]" : ""}>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ring-4 ring-[#fbfbfa] sm:h-10 sm:w-10 ${
            muted
              ? "border border-stone-200 bg-white text-stone-300"
              : "border border-stone-300 bg-white text-stone-600"
          }`}
        >
          {index}
        </span>
        <span className="skeleton h-5 w-40 rounded" />
      </div>
      <ul className="space-y-3">
        {rows.map((w, i) => (
          <SkeletonRow key={i} titleWidth={w} />
        ))}
      </ul>
    </section>
  );
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
      <div className="mx-auto flex max-w-lg items-center justify-center gap-3 pb-10 pt-4">
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

      {/* Ghost plan: same rail + phased rows as the finished checklist, so the
          real content stands up in place of the skeleton. */}
      <div className="relative space-y-10 pl-10 sm:pl-12" aria-hidden>
        <div className="absolute bottom-4 left-[15px] top-1 w-px bg-stone-200 sm:left-[19px]">
          <div className="timeline-ink timeline-assemble absolute inset-0 bg-stone-900" />
        </div>
        <SkeletonPhase
          index={1}
          rows={["w-3/5", "w-2/3", "w-1/2", "w-3/5", "w-2/5"]}
        />
        <SkeletonPhase index={2} rows={["w-1/2", "w-3/5"]} muted />
      </div>
    </div>
  );
}
