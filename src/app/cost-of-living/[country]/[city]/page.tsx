import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReloApp from "@/components/ReloApp";
import CityBudget, { cityTierLabel } from "@/components/CityBudget";
import SiteFooter from "@/components/SiteFooter";
import { findDestination } from "@/lib/countries";
import { OPEN_DATA_UPDATED_AT } from "@/lib/countryOpenData.generated";
import { SITE_URL } from "@/lib/siteUrls";
import { formatMonth } from "@/lib/dates";
import {
  allCostCityParams,
  cityCostForSlugs,
  citySlug,
  costDetailForSlug,
  formatRange,
  COST_OF_LIVING_VERIFIED,
} from "@/lib/costOfLiving";

interface Params {
  country: string;
  city: string;
}

export function generateStaticParams(): Params[] {
  return allCostCityParams();
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { country, city } = await params;
  const dest = findDestination(country);
  const found = cityCostForSlugs(country, city);
  if (!dest || !found) return {};
  const cityName = found.city.city;
  const title = `Cost of living in ${cityName} (2026): monthly budget & prices`;
  const description = `What it really costs to live in ${cityName}, ${dest.name}: rent, groceries, utilities, transport and a realistic monthly budget — plus a free relocation plan tailored to your household.`;
  return {
    title,
    description,
    alternates: { canonical: `/cost-of-living/${dest.slug}/${city}` },
    openGraph: {
      title,
      description,
      url: `/cost-of-living/${dest.slug}/${city}`,
    },
    other: { "article:modified_time": OPEN_DATA_UPDATED_AT },
  };
}

export default async function CostOfLivingCityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country, city } = await params;
  const dest = findDestination(country);
  const found = cityCostForSlugs(country, city);
  if (!dest || !found) notFound();
  const { country: cc, city: c } = found;
  const cityName = c.city;
  const detail = costDetailForSlug(dest.slug);
  const siblings = (detail?.cities ?? []).filter((s) => s.city !== cityName);

  const single = c.monthlyBudgetSingle;
  const family = c.monthlyBudgetFamily4;
  const faqs: { q: string; a: string }[] = [];
  if (single) {
    faqs.push({
      q: `How much money do I need to live in ${cityName}?`,
      a: `In ${cityName}, expect roughly ${formatRange(single.usd, "USD")} a month in living costs for a single person${family ? `, and about ${formatRange(family.usd, "USD")} for a family of four` : ""}, excluding rent (${formatMonth(cc.asOf)}). Add rent from the breakdown below — a one-bed typically runs ${c.rent1brCenter ? formatRange(c.rent1brCenter.usd, "USD") : "the amounts shown"} in the centre. Generate a free plan above for a budget matched to your household and priorities.`,
    });
  }
  if (c.rent1brCenter && c.rent1brOutside) {
    faqs.push({
      q: `How much is rent in ${cityName}?`,
      a: `A one-bedroom flat in the centre runs about ${formatRange(c.rent1brCenter.usd, "USD")} a month (${formatRange(c.rent1brCenter.local, cc.currency)}); outside the centre it is roughly ${formatRange(c.rent1brOutside.usd, "USD")}. Rents vary sharply by district — always confirm current listings.`,
    });
  }
  faqs.push({
    q: `How current is this cost data?`,
    a: `These figures reflect ${formatMonth(cc.asOf)} and are ranges, not exact prices. Every source is linked below. Always confirm current prices locally before you budget.`,
  });

  const pageUrl = `${SITE_URL}/cost-of-living/${dest.slug}/${city}`;
  const jsonLd = {
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
            item: `${SITE_URL}/cost-of-living/${dest.slug}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `Cost of living in ${cityName}`,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        name: `Cost of living in ${cityName}`,
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
          href={`/cost-of-living/${dest.slug}`}
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← Cost of living in {dest.name}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Cost of living in {cityName} in 2026
        </h1>
        <p className="mx-auto mt-2 text-[11px] font-medium uppercase tracking-wider text-stone-500">
          {dest.emoji} {dest.name} · {cityTierLabel(c.tier)}
        </p>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
          What it really costs to live in {cityName}: rent, groceries,
          utilities, transport and a realistic monthly budget. Generate a free
          plan below with a budget tailored to your household.
        </p>
      </section>

      <section className="pb-10">
        <ReloApp initialTo={dest.name} />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 print:hidden">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          Monthly costs in {cityName}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Typical monthly figures shown in USD (local currency in parentheses).
          Ranges, not exact prices — reviewed {formatMonth(COST_OF_LIVING_VERIFIED)}.
          Always confirm current prices before you budget.
        </p>
        <div className="mt-5">
          <CityBudget city={c} currency={cc.currency} showCityName={false} />
        </div>

        {(cc.costIndexVsUsa || cc.incomeTaxHeadline || cc.vatRate) && (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {cc.costIndexVsUsa && (
              <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                  Cost index vs USA
                </p>
                <p className="tnum mt-0.5 text-base font-semibold text-stone-900">
                  {cc.costIndexVsUsa.value}
                  <span className="ml-1 text-xs font-normal text-stone-500">
                    / 100
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  {cc.costIndexVsUsa.basis}
                </p>
              </div>
            )}
            {cc.incomeTaxHeadline && (
              <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                  Income tax ({dest.name})
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-stone-700">
                  {cc.incomeTaxHeadline.sourceUrl ? (
                    <a
                      href={cc.incomeTaxHeadline.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
                    >
                      {cc.incomeTaxHeadline.note}
                    </a>
                  ) : (
                    cc.incomeTaxHeadline.note
                  )}
                </p>
              </div>
            )}
            {cc.vatRate && (
              <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                  VAT / GST
                </p>
                <p className="tnum mt-0.5 text-base font-semibold text-stone-900">
                  {cc.vatRate.value}%
                </p>
                {cc.vatRate.note && (
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    {cc.vatRate.note}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {cc.privateHealthInsuranceMonthUsd && (
          <div className="mt-4 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            <span className="font-semibold text-stone-900">
              Private health insurance:
            </span>{" "}
            {formatRange(
              [
                cc.privateHealthInsuranceMonthUsd.low,
                cc.privateHealthInsuranceMonthUsd.high,
              ],
              "USD",
            )}{" "}
            / month
            {cc.privateHealthInsuranceMonthUsd.note
              ? ` (${cc.privateHealthInsuranceMonthUsd.note})`
              : ""}
            .
          </div>
        )}

        {cc.keyCostNotes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {cc.keyCostNotes.map((note, i) => (
              <li
                key={i}
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm leading-relaxed text-stone-700"
              >
                {note}
              </li>
            ))}
          </ul>
        )}

        {cc.sources.length > 0 && (
          <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
            Sources:{" "}
            {cc.sources.map((s, i) => (
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </section>

      {siblings.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-10 print:hidden">
          <h2 className="text-lg font-semibold text-stone-900">
            Other cities in {dest.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {siblings.map((s) => (
              <Link
                key={s.city}
                href={`/cost-of-living/${dest.slug}/${citySlug(s.city)}`}
                className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
              >
                {s.city}
              </Link>
            ))}
            <Link
              href={`/moving-to/${dest.slug}`}
              className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
            >
              {dest.emoji} Moving to {dest.name}
            </Link>
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
