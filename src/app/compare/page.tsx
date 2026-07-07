import type { Metadata } from "next";
import Link from "next/link";
import { DESTINATIONS } from "@/lib/countries";

export const metadata: Metadata = {
  title: "Compare countries for relocation: cost, taxes, climate, safety",
  description:
    "Side-by-side country comparisons for movers: cost of living signals, taxes and special regimes, climate, air quality, internet and safety. Live data with sources and verification dates.",
  alternates: { canonical: "/compare" },
};

export default function CompareIndexPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-8 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← Reloka
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Compare two countries before you move
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
          Prices, taxes and special regimes, climate, air quality, internet,
          safety. Every number sourced and dated, so you are not deciding on
          2023 blog posts.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12">
        {DESTINATIONS.map((a, i) => {
          const others = DESTINATIONS.slice(i + 1);
          if (others.length === 0) return null;
          return (
            <div key={a.slug} className="mt-6 first:mt-0">
              <h2 className="text-sm font-semibold text-stone-900">
                {a.emoji} {a.name} vs …
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {others.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/compare/${a.slug}-vs-${b.slug}`}
                    className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
                  >
                    {b.emoji} {b.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-400">
        Reloka · Not legal, tax or immigration advice. Always verify
        official requirements.
      </footer>
    </main>
  );
}
