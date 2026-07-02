"use client";

import { useEffect, useState } from "react";

const PHASES = ["Before you go", "First week", "First month", "First 90 days"];
const STEPS = [
  "Analyzing your destination…",
  "Checking visa & residency rules…",
  "Mapping banking, tax & healthcare…",
  "Assembling your personalized plan…",
];

export default function PlanSkeleton() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl reveal">
      <div className="mb-8 flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-700" />
        <p
          key={step}
          className="reveal text-sm font-medium text-zinc-600"
          aria-live="polite"
        >
          {STEPS[step]}
        </p>
      </div>

      <div className="space-y-7">
        {PHASES.map((phase, pi) => (
          <section key={phase}>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-400">
                {pi + 1}
              </span>
              <span className="text-lg font-semibold text-zinc-300">{phase}</span>
            </div>
            <div className="space-y-3">
              {Array.from({ length: pi === 0 ? 3 : 2 }).map((_, ii) => (
                <div
                  key={ii}
                  className="rounded-lg border border-zinc-200 bg-white p-4"
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
