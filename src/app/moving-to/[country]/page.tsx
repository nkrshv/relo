import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReloApp from "@/components/ReloApp";
import { DESTINATIONS, findDestination } from "@/lib/countries";
import { OPEN_DATA_UPDATED_AT } from "@/lib/countryOpenData.generated";
import { taxRegimesForCountry } from "@/lib/taxRegimes";
import { factsForCountry, COUNTRY_FACTS_VERIFIED } from "@/lib/countryFacts";
import { formatMonth } from "@/lib/dates";
import MessengerIcons from "@/components/MessengerIcons";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/siteUrls";
import {
  quickFacts,
  introHighlights,
  faqFor,
  renderFact,
  OUTLINE,
} from "@/lib/movingToContent";

interface Params {
  country: string;
}

export function generateStaticParams(): Params[] {
  return DESTINATIONS.map((d) => ({ country: d.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { country } = await params;
  const dest = findDestination(country);
  if (!dest) return {};
  const title = `Moving to ${dest.name}: visas, cost of living & 2026 checklist`;
  const description = `How to move to ${dest.name}: visa and residency routes, cost of living, housing, banking, healthcare and taxes — plus a free personalized relocation checklist tailored to your passport and situation.`;
  return {
    title,
    description,
    alternates: { canonical: `/moving-to/${dest.slug}` },
    openGraph: { title, description, url: `/moving-to/${dest.slug}` },
    other: { "article:modified_time": OPEN_DATA_UPDATED_AT },
  };
}

export default async function MovingToPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country } = await params;
  const dest = findDestination(country);
  if (!dest) notFound();
  const facts = quickFacts(dest.name);
  const regimes = taxRegimesForCountry(dest.name);
  const faqs = faqFor(dest.name);
  const highlights = introHighlights(dest.name);
  const essentials = factsForCountry(dest.name);
  const pageUrl = `${SITE_URL}/moving-to/${dest.slug}`;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Reloka", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: `Moving to ${dest.name}`,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        name: `Moving to ${dest.name}: relocation checklist`,
        url: pageUrl,
        dateModified: OPEN_DATA_UPDATED_AT,
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
    ],
  };

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-8 text-center print:hidden">
        <Link
          href="/"
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← Reloka
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Moving to {dest.name}: your relocation checklist
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
          How to move to {dest.name}: the visa and residency routes, cost of
          living, banking, healthcare and taxes you&apos;ll deal with, organized
          by phase. Generate a free plan tailored to your passport, family, and
          budget below.
        </p>
        {highlights && (
          <p className="mx-auto mt-3 max-w-xl text-sm text-stone-500">
            {highlights}
          </p>
        )}
        {dest.slug !== "united-states" && (
          <p className="mx-auto mt-3 max-w-xl text-sm text-stone-500">
            Moving from the United States?{" "}
            <Link
              href={`/moving-to/${dest.slug}/from-usa`}
              className="font-medium text-stone-600 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
            >
              See the {dest.name} from the USA guide
            </Link>
            .
          </p>
        )}
        <p className="mx-auto mt-3 max-w-xl text-sm text-stone-500">
          Budgeting the move?{" "}
          <Link
            href={`/cost-of-living/${dest.slug}`}
            className="font-medium text-stone-600 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
          >
            See the cost of living in {dest.name}
          </Link>
          .
        </p>
      </section>

      <section className="pb-10">
        <ReloApp initialTo={dest.name} />
      </section>

      {facts.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-10 print:hidden">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
            {dest.name} at a glance
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Live and regularly refreshed data, each fact with its source.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {facts.map((f) => (
              <div
                key={f.label}
                className="rounded-lg border border-stone-200 bg-white px-3 py-3"
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                  {f.label}
                </p>
                <p className="tnum mt-1 flex items-center gap-1.5 text-sm font-semibold text-stone-900">
                  {f.messengers && <MessengerIcons messengers={f.messengers} />}
                  <span>{f.value}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500">{f.source}</p>
              </div>
            ))}
          </div>
          {regimes.length > 0 && (
            <div className="mt-4 space-y-2">
              {regimes.map((r) => (
                <div
                  key={r.name}
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                      Special tax regime
                    </span>
                    {r.status !== "active" && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        {r.status === "closed" ? "Closed" : "Recently changed"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {r.name}
                  </p>
                  <p className="mt-0.5 text-sm text-stone-700">{r.headline}</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500">
                    {r.detail}
                    {r.statusNote ? ` ${r.statusNote}.` : ""}
                  </p>
                  <p className="mt-1.5 text-[11px] text-stone-500">
                    Verified {formatMonth(r.verified)} ·{" "}
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-700"
                    >
                      {r.sourceLabel}
                    </a>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {essentials && essentials.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-10 print:hidden">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
            Getting set up in {dest.name}: key steps &amp; official resources
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            The main immigration, tax, healthcare and housing bodies you&apos;ll
            deal with, with the official portals and typical costs. Curated and
            hand-verified — last reviewed {formatMonth(COUNTRY_FACTS_VERIFIED)}.
            Figures are approximate; always confirm the current numbers on the
            official site.
          </p>
          <ul className="mt-5 space-y-3">
            {essentials.map((fact, i) => (
              <li
                key={i}
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm leading-relaxed text-stone-700"
              >
                {renderFact(fact)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-4 py-10 print:hidden">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          The {dest.name} relocation checklist at a glance
        </h2>
        <div className="mt-6 space-y-8">
          {OUTLINE.map((block, i) => (
            <div key={block.phase}>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-stone-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-300 bg-white text-xs font-medium text-stone-600">
                  {i + 1}
                </span>
                {block.phase}
              </h3>
              <ul className="mt-2 divide-y divide-stone-200/70">
                {block.items.map((item) => (
                  <li key={item} className="py-2.5 text-sm text-stone-600">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 rounded-lg border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-500">
          This is a general outline. Your personalized plan above adapts every
          step to where you&apos;re moving from, your visa status, and your
          situation. Always verify official requirements: this is not legal or
          immigration advice.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 print:hidden">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          Frequently asked questions
        </h2>
        <div className="mt-5 divide-y divide-stone-200/70">
          {faqs.map((f) => (
            <div key={f.q} className="py-4">
              <h3 className="text-sm font-semibold text-stone-900">{f.q}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                {f.a}
              </p>
            </div>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 print:hidden">
        <h2 className="text-center text-lg font-semibold text-stone-900">
          Compare {dest.name} with another country
        </h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {DESTINATIONS.filter((d) => d.slug !== dest.slug).map((d) => {
            const ai = DESTINATIONS.findIndex((x) => x.slug === dest.slug);
            const bi = DESTINATIONS.findIndex((x) => x.slug === d.slug);
            const pair =
              ai < bi ? `${dest.slug}-vs-${d.slug}` : `${d.slug}-vs-${dest.slug}`;
            return (
              <Link
                key={d.slug}
                href={`/compare/${pair}`}
                className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
              >
                vs {d.emoji} {d.name}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 print:hidden">
        <h2 className="text-center text-lg font-semibold text-stone-900">
          Other destinations
        </h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {DESTINATIONS.filter((d) => d.slug !== dest.slug).map((d) => (
            <Link
              key={d.slug}
              href={`/moving-to/${d.slug}`}
              className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
            >
              Moving to {d.name}
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
