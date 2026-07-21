"use client";

import { useEffect, useRef, useState } from "react";
import type { ReloInput, ReloPlan, VisaSummary } from "@/lib/types";
import { planToMarkdown, planFileStem } from "@/lib/exportPlan";
import { track } from "@/lib/analytics";
import { ChevronDownIcon, FileTextIcon, MarkdownFileIcon } from "@/components/icons";

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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    try {
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
      track("Plan Exported", { format: "markdown" });
    } catch {
      track("Plan Export Failed", { format: "markdown" });
      setError("Couldn't build the file. Try again.");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${TRIGGER_STYLES[variant]}`}
      >
        Export
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
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
            <FileTextIcon className="h-4 w-4 shrink-0 text-stone-400" />
            Save as PDF
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={exportMarkdown}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50"
          >
            <MarkdownFileIcon className="h-4 w-4 shrink-0 text-stone-400" />
            Save as Markdown
          </button>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="absolute right-0 z-30 mt-1.5 w-52 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
