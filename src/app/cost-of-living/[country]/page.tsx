import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReloApp from "@/components/ReloApp";
import { DESTINATIONS, findDestination } from "@/lib/countries";
import { OPEN_DATA_UPDATED_AT } from "@/lib/countryOpenData.generated";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/siteUrls";
import { formatMonth } from "@/lib/dates";
import { costFacts, costIntro, costFaqFor } from "@/lib/costContent";
import CityBudget from "@/components/CityBudget";
import {
  costDetailForSlug,
  citySlug,
  formatRange,
  COST_OF_LIVING_VERIFIED,
} from "@/lib/costOfLiving";

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
  const title = `Cost of living in ${dest.name} (2026): monthly budget & prices`;
  const description = `What it really costs to live in ${dest.name}: rent, groceries, utilities, transport and a realistic monthly budget — plus a free relocation plan tailored to your city and household.`;
  return {
    title,
    description,
    alternates: { canonical: `/cost-of-living/${dest.slug}` },
    openGraph: { title, description, url: `/cost-of-living/${dest.slug}` },
    other: { "article:modified_time": OPEN_DATA_UPDATED_AT },
  };
}

export default async function CostOfLivingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country } = await params;
  const dest = findDestination(country);
  if (!dest) notFound();
  const facts = costFacts(dest.name);
  const intro = costIntro(dest.name);
  const detail = costDetailForSlug(dest.slug);
  const faqs = costFaqFor(dest.name, detail);
  const pageUrl = `${SITE_URL}/cost-of-living/${dest.slug}`;
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
            name: `Cost of living in ${dest.name}`,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        name: `Cost of living in ${dest.name}`,
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
          Cost of living in {dest.name} in 2026
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
          What it really costs to live in {dest.name}: rent, groceries,
          utilities, transport and a realistic monthly budget. Generate a free
          plan below with a budget tailored to your city and household.
        </p>
        {intro && (
          <p className="mx-auto mt-3 max-w-xl text-sm text-stone-500">{intro}</p>
        )}
        <p className="mx-auto mt-3 max-w-xl text-sm text-stone-500">
          Planning the move itself?{" "}
          <Link
            href={`/moving-to/${dest.slug}`}
            className="font-medium text-stone-600 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
          >
            See the {dest.name} relocation guide
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
            {dest.name} costs at a glance
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Country-wide indicators, each with its source. City-level figures
            below where available.
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
                <p className="tnum mt-1 text-sm font-semibold text-stone-900">
                  {f.value}
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500">{f.source}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {detail && detail.cities.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-10 print:hidden">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
            Monthly costs in {dest.name}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Typical monthly figures shown in USD (local currency in
            parentheses). Ranges, not exact prices — reviewed{" "}
            {formatMonth(COST_OF_LIVING_VERIFIED)}. Always confirm current
            prices before you budget.
          </p>
          <div className="mt-5 space-y-4">
            {detail.cities.map((c) => (
              <div key={c.city}>
                <CityBudget city={c} currency={detail.currency} />
                <p className="mt-1.5 px-1 text-right text-xs">
                  <Link
                    href={`/cost-of-living/${dest.slug}/${citySlug(c.city)}`}
                    className="font-medium text-stone-500 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
                  >
                    Full {c.city} cost of living →
                  </Link>
                </p>
              </div>
            ))}
          </div>

          {(detail.costIndexVsUsa ||
            detail.incomeTaxHeadline ||
            detail.vatRate) && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {detail.costIndexVsUsa && (
                <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                    Cost index vs USA
                  </p>
                  <p className="tnum mt-0.5 text-base font-semibold text-stone-900">
                    {detail.costIndexVsUsa.value}
                    <span className="ml-1 text-xs font-normal text-stone-500">
                      / 100
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    {detail.costIndexVsUsa.basis}
                  </p>
                </div>
              )}
              {detail.incomeTaxHeadline && (
                <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                    Income tax
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-stone-700">
                    {detail.incomeTaxHeadline.sourceUrl ? (
                      <a
                        href={detail.incomeTaxHeadline.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
                      >
                        {detail.incomeTaxHeadline.note}
                      </a>
                    ) : (
                      detail.incomeTaxHeadline.note
                    )}
                  </p>
                </div>
              )}
              {detail.vatRate && (
                <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                    VAT / GST
                  </p>
                  <p className="tnum mt-0.5 text-base font-semibold text-stone-900">
                    {detail.vatRate.value}%
                  </p>
                  {detail.vatRate.note && (
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      {detail.vatRate.note}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {detail.privateHealthInsuranceMonthUsd && (
            <div className="mt-4 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
              <span className="font-semibold text-stone-900">
                Private health insurance:
              </span>{" "}
              {formatRange(
                [
                  detail.privateHealthInsuranceMonthUsd.low,
                  detail.privateHealthInsuranceMonthUsd.high,
                ],
                "USD",
              )}{" "}
              / month
              {detail.privateHealthInsuranceMonthUsd.note
                ? ` (${detail.privateHealthInsuranceMonthUsd.note})`
                : ""}
              .
            </div>
          )}

          {detail.keyCostNotes.length > 0 && (
            <ul className="mt-4 space-y-2">
              {detail.keyCostNotes.map((note, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm leading-relaxed text-stone-700"
                >
                  {note}
                </li>
              ))}
            </ul>
          )}

          {detail.sources.length > 0 && (
            <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
              Sources:{" "}
              {detail.sources.map((s, i) => (
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
        </section>
      )}

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
          Cost of living in other countries
        </h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {DESTINATIONS.filter((d) => d.slug !== dest.slug).map((d) => (
            <Link
              key={d.slug}
              href={`/cost-of-living/${d.slug}`}
              className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
            >
              {d.emoji} {d.name}
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
