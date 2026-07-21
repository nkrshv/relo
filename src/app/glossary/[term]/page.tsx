import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import { findDestination } from "@/lib/countries";
import { SITE_URL } from "@/lib/siteUrls";
import { formatMonth } from "@/lib/dates";
import {
  GLOSSARY_VERIFIED,
  allGlossarySlugs,
  glossaryTermForSlug,
} from "@/lib/glossary";

interface Params {
  term: string;
}

export function generateStaticParams(): Params[] {
  return allGlossarySlugs().map((term) => ({ term }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { term } = await params;
  const entry = glossaryTermForSlug(term);
  if (!entry) return {};
  const title = `What is ${entry.term}? Definition for movers`;
  return {
    title,
    description: entry.short,
    alternates: { canonical: `/glossary/${entry.slug}` },
    openGraph: { title, description: entry.short, url: `/glossary/${entry.slug}` },
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { term } = await params;
  const entry = glossaryTermForSlug(term);
  if (!entry) notFound();

  const relatedTerms = (entry.related ?? [])
    .map((s) => glossaryTermForSlug(s))
    .filter((t): t is NonNullable<typeof t> => t !== null);
  const relatedCountries = (entry.relatedCountries ?? [])
    .map((s) => findDestination(s))
    .filter((d): d is NonNullable<typeof d> => d !== undefined);

  const pageUrl = `${SITE_URL}/glossary/${entry.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTerm",
        name: entry.term,
        description: entry.short,
        inDefinedTermSet: `${SITE_URL}/glossary`,
        url: pageUrl,
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What is ${entry.term}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${entry.short} ${entry.body[0]}`,
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Reloka", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Relocation glossary",
            item: `${SITE_URL}/glossary`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: entry.term,
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
      <article className="mx-auto max-w-2xl px-4 pt-14 pb-8">
        <Link
          href="/glossary"
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← Relocation glossary
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          What is {entry.term}?
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-stone-700">
          {entry.short}
        </p>
        {entry.aliases && entry.aliases.length > 0 && (
          <p className="mt-2 text-sm text-stone-500">
            Also searched as: {entry.aliases.join(", ")}.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {entry.body.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-stone-700">
              {p}
            </p>
          ))}
        </div>

        {entry.sources && entry.sources.length > 0 && (
          <p className="mt-6 text-xs leading-relaxed text-stone-500">
            Official source:{" "}
            {entry.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 && " · "}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-700"
                >
                  {s.label}
                </a>
              </span>
            ))}
            .
          </p>
        )}

        <p className="mt-4 text-xs text-stone-500">
          Reviewed {formatMonth(GLOSSARY_VERIFIED)}. General information, not
          legal, tax or immigration advice — always verify current official
          requirements.
        </p>

        <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 px-6 py-6 text-center">
          <p className="text-base font-semibold text-stone-900">
            Where does this fit in your move?
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">
            Get a free relocation checklist that sequences the paperwork,
            deadlines and steps for your exact situation.
          </p>
          <Link
            href="/plan"
            className="pressable mt-4 inline-block rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            Build my free plan
          </Link>
        </div>

        {(relatedCountries.length > 0 || relatedTerms.length > 0) && (
          <div className="mt-8 space-y-4">
            {relatedCountries.length > 0 && (
              <div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Where it matters
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {relatedCountries.map((d) => (
                    <Link
                      key={d.slug}
                      href={`/moving-to/${d.slug}`}
                      className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
                    >
                      {d.emoji} Moving to {d.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {relatedTerms.length > 0 && (
              <div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Related terms
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {relatedTerms.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/glossary/${t.slug}`}
                      className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
                    >
                      {t.term}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </article>

      <SiteFooter />
    </main>
  );
}
