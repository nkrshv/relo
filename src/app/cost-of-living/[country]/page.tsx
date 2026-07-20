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
import {
  costDetailForSlug,
  formatRange,
  COST_OF_LIVING_VERIFIED,
  type CityCost,
  type MoneyRange,
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

// The budget rows we render for a city, in display order.
const ROWS: { key: keyof CityCost; label: string }[] = [
  { key: "rent1brCenter", label: "Rent · 1-bed, city centre" },
  { key: "rent1brOutside", label: "Rent · 1-bed, outside centre" },
  { key: "rent3brCenter", label: "Rent · 3-bed, city centre" },
  { key: "utilitiesBasic", label: "Utilities (electric, water, gas)" },
  { key: "internet", label: "Home internet" },
  { key: "mobilePlan", label: "Mobile plan" },
  { key: "groceriesSingle", label: "Groceries · one adult" },
  { key: "mealInexpensive", label: "Meal · inexpensive restaurant" },
  { key: "mealMidForTwo", label: "Dinner for two · mid-range" },
  { key: "publicTransportPass", label: "Monthly transit pass" },
];

function CityBudget({
  city,
  currency,
}: {
  city: CityCost;
  currency: string;
}) {
  const rows = ROWS.filter(
    (r) => city[r.key] && typeof city[r.key] === "object",
  );
  const tierLabel =
    city.tier === "capital"
      ? "Capital"
      : city.tier === "popular_expat"
        ? "Popular with expats"
        : "Major city";
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-stone-900">{city.city}</h3>
        <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
          {tierLabel}
        </span>
      </div>
      <dl className="mt-3 divide-y divide-stone-200/70">
        {rows.map((r) => {
          const m = city[r.key] as MoneyRange;
          return (
            <div
              key={r.key}
              className="flex items-baseline justify-between gap-4 py-2 text-sm"
            >
              <dt className="text-stone-600">{r.label}</dt>
              <dd className="tnum text-right font-medium text-stone-900">
                {formatRange(m.usd, "USD")}
                <span className="ml-1 text-xs font-normal text-stone-500">
                  ({formatRange(m.local, currency)})
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
      {(city.monthlyBudgetSingle || city.monthlyBudgetFamily4) && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {city.monthlyBudgetSingle && (
            <div className="rounded-lg bg-stone-50 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                Monthly budget · single
              </p>
              <p className="tnum mt-0.5 text-base font-semibold text-stone-900">
                {formatRange(city.monthlyBudgetSingle.usd, "USD")}
              </p>
            </div>
          )}
          {city.monthlyBudgetFamily4 && (
            <div className="rounded-lg bg-stone-50 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                Monthly budget · family of four
              </p>
              <p className="tnum mt-0.5 text-base font-semibold text-stone-900">
                {formatRange(city.monthlyBudgetFamily4.usd, "USD")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
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
  const faqs = costFaqFor(dest.name);
  const detail = costDetailForSlug(dest.slug);
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
              <CityBudget key={c.city} city={c} currency={detail.currency} />
            ))}
          </div>

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
