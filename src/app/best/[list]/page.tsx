import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReloApp from "@/components/ReloApp";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/siteUrls";
import { formatMonth } from "@/lib/dates";
import {
  RANKINGS_VERIFIED,
  allRankingSlugs,
  rankingForSlug,
} from "@/lib/rankings";

interface Params {
  list: string;
}

export function generateStaticParams(): Params[] {
  return allRankingSlugs().map((list) => ({ list }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { list } = await params;
  const ranking = rankingForSlug(list);
  if (!ranking) return {};
  return {
    title: ranking.metaTitle,
    description: ranking.description,
    alternates: { canonical: `/best/${ranking.slug}` },
    openGraph: {
      title: ranking.metaTitle,
      description: ranking.description,
      url: `/best/${ranking.slug}`,
    },
  };
}

export default async function RankingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { list } = await params;
  const ranking = rankingForSlug(list);
  if (!ranking) notFound();
  const entries = ranking.compute();
  const pageUrl = `${SITE_URL}/best/${ranking.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: ranking.h1,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: entries.length,
        itemListElement: entries.map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: e.name,
          url: `${SITE_URL}/${ranking.linkTo}/${e.slug}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Reloka", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Relocation rankings",
            item: `${SITE_URL}/best`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: ranking.h1,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-8 text-center print:hidden">
        <Link
          href="/best"
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← All rankings
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          {ranking.h1}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
          {ranking.intro}
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-10">
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="grid grid-cols-[auto_1fr_auto] gap-3 border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <span>#</span>
            <span>Country</span>
            <span className="text-right">{ranking.metricLabel}</span>
          </div>
          {entries.map((e, i) => (
            <Link
              key={e.slug}
              href={`/${ranking.linkTo}/${e.slug}`}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-stone-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-stone-50"
            >
              <span className="tnum text-sm font-semibold text-stone-400">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-stone-900">
                {e.emoji} {e.name}
              </span>
              <span className="tnum text-right text-sm text-stone-800">
                {e.display}
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          {ranking.methodology} Reviewed {formatMonth(RANKINGS_VERIFIED)}. Source:{" "}
          {ranking.source.url ? (
            <a
              href={ranking.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-700"
            >
              {ranking.source.label}
            </a>
          ) : (
            ranking.source.label
          )}
          . Figures are estimates — confirm current numbers before you budget.
        </p>
        <p className="mt-2 text-sm text-stone-600">{ranking.whoFor}</p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-4 pb-2 text-center print:hidden">
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">
          A ranking is a starting point
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
          Your real budget and eligibility depend on your city, household,
          passport and visa route. Generate a free plan tailored to your move.
        </p>
      </section>

      <section className="pb-12 print:hidden">
        <ReloApp />
      </section>

      <SiteFooter />
    </main>
  );
}
