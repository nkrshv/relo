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

export default function PlanSkeleton() {
  const [step, setStep] = useState(0);

  // Advance through the checks, then hold on the last one until the
  // real plan arrives and this component unmounts.
  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 2100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl reveal">
      <ol className="mb-8 space-y-2" aria-live="polite">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 text-sm transition-colors duration-300 ${
                done
                  ? "text-stone-400"
                  : active
                    ? "font-medium text-stone-800"
                    : "text-stone-300"
              }`}
            >
              {done ? (
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
              {done && <span className="sr-only">— done</span>}
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
