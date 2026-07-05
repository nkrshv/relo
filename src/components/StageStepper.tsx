"use client";

const STAGES = ["Your move", "Building your plan", "Your checklist"];

interface Props {
  /** 1-based index of the current stage. */
  current: 1 | 2 | 3;
}

// Horizontal three-stage progress bar shown above the plan flow:
// form → loading → checklist. Mirrors the loading list's visual language
// (emerald checks, stone palette, thin lines).
export default function StageStepper({ current }: Props) {
  return (
    <nav aria-label="Progress" className="reveal mx-auto mb-10 w-full max-w-lg print:hidden">
      <ol className="flex items-center">
        {STAGES.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li
              key={label}
              className={i < STAGES.length - 1 ? "flex flex-1 items-center" : "flex items-center"}
              aria-current={active ? "step" : undefined}
            >
              <span className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors duration-300 ${
                    done
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : active
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white text-stone-400"
                  }`}
                >
                  {done ? (
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                    </svg>
                  ) : (
                    step
                  )}
                </span>
                <span
                  className={`whitespace-nowrap text-xs sm:text-sm ${
                    active
                      ? "font-medium text-stone-900"
                      : done
                        ? "text-stone-500"
                        : "text-stone-400"
                  }`}
                >
                  {label}
                  {done && <span className="sr-only">, done</span>}
                </span>
              </span>
              {i < STAGES.length - 1 && (
                <span
                  className={`mx-3 h-px flex-1 transition-colors duration-500 ${
                    done ? "bg-emerald-600/60" : "bg-stone-200"
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
