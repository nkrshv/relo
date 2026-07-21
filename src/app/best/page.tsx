import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/siteUrls";
import { RANKINGS } from "@/lib/rankings";

export const metadata: Metadata = {
  title: "Relocation rankings: cheapest and safest countries to move to",
  description:
    "Data-driven rankings for people planning a move: cheapest countries to live in, cheapest for families, lowest cost of living, and safest countries — each with the numbers and sources.",
  alternates: { canonical: "/best" },
  openGraph: {
    title: "Relocation rankings",
    description:
      "Cheapest and safest countries to move to, ranked from real data.",
    url: "/best",
  },
};

export default function RankingsIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Reloka", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Relocation rankings",
        item: `${SITE_URL}/best`,
      },
    ],
  };

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-8 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← Reloka
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Relocation rankings
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
          Every ranking is built from one clearly stated metric and real,
          sourced data — no vague &ldquo;best of&rdquo; opinions.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="grid gap-3 sm:grid-cols-2">
          {RANKINGS.map((r) => (
            <Link
              key={r.slug}
              href={`/best/${r.slug}`}
              className="rounded-xl border border-stone-200 bg-white px-5 py-4 transition-colors hover:bg-stone-50"
            >
              <p className="text-base font-semibold text-stone-900">{r.h1}</p>
              <p className="mt-1 text-sm text-stone-500">{r.whoFor}</p>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
