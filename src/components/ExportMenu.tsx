"use client";

import { useEffect, useRef, useState } from "react";
import type { ReloInput, ReloPlan, VisaSummary } from "@/lib/types";
import { planToMarkdown, planFileStem } from "@/lib/exportPlan";
import { track } from "@/lib/analytics";

type Variant = "default" | "emerald";

interface Props {
  input: ReloInput;
  plan: ReloPlan;
  visa: VisaSummary | null;
  shareUrl?: string | null;
  variant?: Variant;
}

const TRIGGER_STYLES: Record<Variant, string> = {
  default:
    "border border-stone-300 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900",
  emerald:
    "bg-emerald-700 text-white hover:bg-emerald-800 border border-transparent",
};

export default function ExportMenu({
  input,
  plan,
  visa,
  shareUrl,
  variant = "default",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function exportPdf() {
    setOpen(false);
    track("Plan Exported", { format: "pdf" });
    window.print();
  }

  function exportMarkdown() {
    setOpen(false);
    track("Plan Exported", { format: "markdown" });
    const md = planToMarkdown(input, plan, visa, { shareUrl });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${planFileStem(input)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${TRIGGER_STYLES[variant]}`}
      >
        Export
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1.5 w-52 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={exportPdf}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-4 w-4 shrink-0 text-stone-400"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 3.5h5L15 7v9.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 3.5V7H15" />
            </svg>
            Save as PDF
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={exportMarkdown}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-4 w-4 shrink-0 text-stone-400"
              aria-hidden
            >
              <rect x="2.5" y="5" width="15" height="10" rx="1.5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.5 12.5v-4l2 2.2 2-2.2v4M13 8.5v3.2M11.6 10.6 13 12l1.4-1.4"
              />
            </svg>
            Save as Markdown
          </button>
        </div>
      )}
    </div>
  );
}
