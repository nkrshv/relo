"use client";

import { useEffect } from "react";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

// Root error boundary: branded fallback for unexpected runtime errors so the
// page never drops to an unstyled crash screen. `unstable_retry` re-renders the
// failed segment on newer Next; `reset` is the older name, so accept either.
export default function Error({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-24 pb-20 text-center">
        <p className="font-mono text-sm font-medium text-stone-500">Error</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Something went wrong on our side
        </h1>
        <p className="mt-4 max-w-md text-lg text-stone-500">
          This one is on us, not you. Try again, and if it keeps happening your
          data is safe. Nothing you entered was lost.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => retry?.()}
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
          >
            Back home
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
