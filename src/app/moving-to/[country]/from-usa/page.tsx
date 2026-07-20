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
import {
  usRelocationForSlug,
  usCountryDetailForSlug,
  US_RELOCATION_VERIFIED,
  SSA_AGREEMENTS_URL,
  IRS_EXPAT_URL,
  IRS_FEIE_URL,
  FBAR_URL,
  IRS_TREATIES_URL,
  type TreatyStatus,
  type LicenseExchange,
} from "@/lib/usRelocation";

interface Params {
  country: string;
}

// One page per destination except the US itself ("moving to the US from the
// US" makes no sense).
export function generateStaticParams(): Params[] {
  return DESTINATIONS.filter((d) => d.slug !== "united-states").map((d) => ({
    country: d.slug,
  }));
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
  const title = `Moving to ${dest.name} from the USA: visas, taxes & 2026 checklist`;
  const description = `How Americans move to ${dest.name}: visa and residency routes, the US tax rules that still apply abroad (FEIE, FBAR, Social Security), cost of living — plus a free personalized checklist for moving from the US.`;
  return {
    title,
    description,
    alternates: { canonical: `/moving-to/${dest.slug}/from-usa` },
    openGraph: { title, description, url: `/moving-to/${dest.slug}/from-usa` },
    other: { "article:modified_time": OPEN_DATA_UPDATED_AT },
  };
}

// One line on the income tax treaty status, worded per its current standing.
function treatyFact(
  name: string,
  treaty: TreatyStatus,
  since?: string,
): string {
  switch (treaty) {
    case "in_force":
      return `The US and ${name} have an income tax treaty in force${since ? ` (since ${since})` : ""} (${IRS_TREATIES_URL}). A treaty can lower withholding on cross-border income like dividends, interest and pensions and set residency tie-breaker rules — it does not remove your US filing obligation.`;
    case "terminated":
      return `The US–${name} income tax treaty was terminated and stopped having effect from 2024 (${IRS_TREATIES_URL}), so US-source dividends, interest and royalties no longer get reduced treaty rates. This is separate from the Social Security agreement below.`;
    case "suspended":
      return `Key articles of the US–${name} income tax treaty were suspended in 2024 (${IRS_TREATIES_URL}), so the usual treaty-reduced withholding rates are inactive for now — in practice treat the treaty as unavailable.`;
    case "signed_not_in_force":
      return `The US and ${name} have signed an income tax treaty, but it is not yet in force pending US ratification (${IRS_TREATIES_URL}), so you cannot rely on treaty benefits yet.`;
    default:
      return `The US has no income tax treaty with ${name} (${IRS_TREATIES_URL}), so there are no treaty-reduced withholding rates or tie-breaker rules to lean on — you rely on the Foreign Earned Income Exclusion and Foreign Tax Credit instead.`;
  }
}

// US-specific facts shown to Americans regardless of destination, plus two
// destination-specific lines: income tax treaty status and the Social Security
// totalization agreement.
function usTaxFacts(name: string, slug: string): string[] {
  const { totalization, treaty, treatySince } = usRelocationForSlug(slug);
  return [
    `As a US citizen or green-card holder you keep filing a US federal tax return on your worldwide income even while living in ${name} — the US taxes based on citizenship, not where you live (${IRS_EXPAT_URL}).`,
    treatyFact(name, treaty, treatySince),
    `Double taxation is usually avoided with the Foreign Earned Income Exclusion (Form 2555, ${IRS_FEIE_URL}) and/or the Foreign Tax Credit (Form 1116); which one is better depends on your income and ${name}'s tax rates.`,
    `If your foreign bank and financial accounts exceed US$10,000 combined at any point in the year, you must file an FBAR (FinCEN Form 114, ${FBAR_URL}); larger balances can also trigger FATCA Form 8938 with your return.`,
    totalization
      ? `The US and ${name} have a Social Security Totalization Agreement (${SSA_AGREEMENTS_URL}), so you generally contribute to only one country's social-security system instead of paying into both, and coverage periods can be combined toward benefits.`
      : `The US has no Social Security Totalization Agreement with ${name} (${SSA_AGREEMENTS_URL}), so you may owe social-security or social-insurance contributions in both countries at once — budget for it and confirm the local rules.`,
  ];
}

function licenseLabel(status: LicenseExchange): string {
  switch (status) {
    case "full_reciprocity":
      return "Exchangeable without a road test";
    case "some_states":
      return "Exchange rules vary by local authority";
    default:
      return "No exchange — local driving test required";
  }
}

export default async function MovingFromUsaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country } = await params;
  const dest = findDestination(country);
  if (!dest || dest.slug === "united-states") notFound();

  const facts = quickFacts(dest.name);
  const regimes = taxRegimesForCountry(dest.name);
  const highlights = introHighlights(dest.name);
  const essentials = factsForCountry(dest.name);
  const taxFacts = usTaxFacts(dest.name, dest.slug);
  const detail = usCountryDetailForSlug(dest.slug);

  const us = usRelocationForSlug(dest.slug);
  const treatyFaqAnswer = ((): string => {
    switch (us.treaty) {
      case "in_force":
        return `Yes. The US and ${dest.name} have an income tax treaty in force, which can reduce withholding on cross-border income and set residency tie-breaker rules. It does not remove your US filing obligation, and you still use the Foreign Earned Income Exclusion or Foreign Tax Credit to avoid double taxation.`;
      case "terminated":
        return `No — not anymore. The US–${dest.name} income tax treaty was terminated and stopped having effect from 2024, so US-source dividends, interest and royalties no longer get reduced treaty rates. Note the Social Security Totalization Agreement is a separate deal and its status is unaffected.`;
      case "suspended":
        return `Not in practice. Key articles of the US–${dest.name} income tax treaty were suspended in 2024, so the usual treaty-reduced withholding rates are inactive. Treat the treaty as unavailable for now and rely on the Foreign Tax Credit instead.`;
      case "signed_not_in_force":
        return `Not yet. The US and ${dest.name} have signed an income tax treaty, but it is awaiting US ratification and is not in force, so you cannot rely on treaty benefits at this point.`;
      default:
        return `No. There is no US income tax treaty with ${dest.name}, so there are no treaty-reduced withholding rates or tie-breaker rules to lean on — you rely on the Foreign Earned Income Exclusion and Foreign Tax Credit to avoid double taxation.`;
    }
  })();

  const usFaqs: { q: string; a: string }[] = [
    {
      q: `Do I still pay US taxes if I move to ${dest.name}?`,
      a: `Yes. The US taxes citizens and green-card holders on worldwide income no matter where they live, so you keep filing a federal return. The Foreign Earned Income Exclusion and the Foreign Tax Credit usually reduce or eliminate double taxation, but the filing obligation itself does not go away.`,
    },
    {
      q: `Is there a US tax treaty with ${dest.name}?`,
      a: treatyFaqAnswer,
    },
    {
      q: `Will I pay into Social Security in both the US and ${dest.name}?`,
      a: us.totalization
        ? `Usually no. The US and ${dest.name} have a Social Security Totalization Agreement, so you generally contribute to only one system and can combine coverage periods toward benefits.`
        : `Possibly yes. The US has no Social Security Totalization Agreement with ${dest.name}, so you may owe contributions to both systems at the same time. Confirm the local rules and factor it into your budget.`,
    },
  ];
  const faqs = [...usFaqs, ...faqFor(dest.name)];

  const pageUrl = `${SITE_URL}/moving-to/${dest.slug}/from-usa`;
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
            item: `${SITE_URL}/moving-to/${dest.slug}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `From the USA`,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        name: `Moving to ${dest.name} from the USA`,
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
          href={`/moving-to/${dest.slug}`}
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← Moving to {dest.name}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Moving to {dest.name} from the USA
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
          A guide for Americans relocating to {dest.name}: the visa and
          residency routes, the US tax and Social Security rules that still
          follow you abroad, cost of living and healthcare. Generate a free plan
          below, pre-set to a move from the United States.
        </p>
        {highlights && (
          <p className="mx-auto mt-3 max-w-xl text-sm text-stone-500">
            {highlights}
          </p>
        )}
      </section>

      <section className="pb-10">
        <ReloApp initialTo={dest.name} initialFrom="United States" />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 print:hidden">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          US taxes &amp; Social Security when you live in {dest.name}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          What stays true for US citizens and green-card holders no matter where
          they move. General information, not tax or legal advice — confirm your
          situation with a cross-border tax professional. Reviewed{" "}
          {formatMonth(US_RELOCATION_VERIFIED)}.
        </p>
        <ul className="mt-5 space-y-3">
          {taxFacts.map((fact, i) => (
            <li
              key={i}
              className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm leading-relaxed text-stone-700"
            >
              {renderFact(fact)}
            </li>
          ))}
        </ul>
      </section>

      {detail && (
        <section className="mx-auto max-w-3xl px-4 py-10 print:hidden">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
            Moving to {dest.name} from the US: the American&apos;s checklist
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            How US citizens apply, whether your license transfers, and the
            things that catch Americans out. Reviewed{" "}
            {formatMonth(US_RELOCATION_VERIFIED)} against official sources;
            always confirm current requirements before you act.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                Applying for a visa
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-700">
                {detail.howToApply}
              </p>
              <p className="mt-2 text-sm text-stone-700">
                <span className="font-medium text-stone-900">
                  Visa-free entry:
                </span>{" "}
                {detail.visaFreeDays === null
                  ? "no standard visa-free entry — see the routes below"
                  : detail.visaFreeDays > 0
                    ? `${detail.visaFreeDays} days`
                    : "none — a visa is required in advance"}
                {detail.visaFreeNote ? ` (${detail.visaFreeNote})` : ""}.
              </p>
              <p className="mt-1 text-sm text-stone-700">
                <span className="font-medium text-stone-900">
                  Main long-stay routes:
                </span>{" "}
                {detail.longStayRoutes.join(", ")}.
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                Your US driver&apos;s license
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-900">
                {licenseLabel(detail.license)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-700">
                {detail.licenseNote}
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {detail.keyNotes.map((note, i) => (
              <li
                key={i}
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm leading-relaxed text-stone-700"
              >
                {note}
              </li>
            ))}
          </ul>
          {detail.officialUrl && detail.officialLabel && (
            <p className="mt-3 text-[11px] text-stone-500">
              Verify at{" "}
              <a
                href={detail.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-700"
              >
                {detail.officialLabel}
              </a>
              .
            </p>
          )}
        </section>
      )}

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
          Moving to {dest.name} from the US, phase by phase
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
          step to your US starting point, visa status, and situation. Always
          verify official requirements: this is not legal or immigration advice.
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

      <section className="mx-auto max-w-3xl px-4 py-10 text-center print:hidden">
        <Link
          href={`/moving-to/${dest.slug}`}
          className="text-sm font-medium text-stone-600 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
        >
          See the full Moving to {dest.name} guide →
        </Link>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 print:hidden">
        <h2 className="text-center text-lg font-semibold text-stone-900">
          Moving to another country from the USA
        </h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {DESTINATIONS.filter(
            (d) => d.slug !== dest.slug && d.slug !== "united-states",
          ).map((d) => (
            <Link
              key={d.slug}
              href={`/moving-to/${d.slug}/from-usa`}
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
