import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReloApp from "@/components/ReloApp";
import { DESTINATIONS, findDestination } from "@/lib/countries";
import { insightsForCountry, climateSummary, INSIGHTS_UPDATED_AT } from "@/lib/countryInsights";
import { openDataForCountry, aqiLabel } from "@/lib/countryOpenData";
import { OPEN_DATA_UPDATED_AT } from "@/lib/countryOpenData.generated";
import { staticDataForCountry } from "@/lib/staticCountryData";
import { advisoryForCountry } from "@/lib/countryAdvisory";
import { taxRegimesForCountry } from "@/lib/taxRegimes";
import { currencyForCountry } from "@/lib/countryCurrency";
import {
  censorshipForCountry,
  allMessengersReachable,
  disruptedMessengers,
  CENSORSHIP_UPDATED_AT,
} from "@/lib/countryCensorship";
import { salaryForCountry, formatSalary } from "@/lib/countrySalaries";
import { formatMonth, formatDate } from "@/lib/dates";
import MessengerIcons from "@/components/MessengerIcons";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/siteUrls";
import type { MessengerReachability } from "@/lib/countryCensorship";

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
  const title = `Moving to ${dest.name}: relocation checklist`;
  const description = `A step-by-step checklist for moving to ${dest.name}: visa and residency, housing, banking, healthcare, taxes and more. Get a free personalized plan.`;
  return {
    title,
    description,
    alternates: { canonical: `/moving-to/${dest.slug}` },
    openGraph: { title, description, url: `/moving-to/${dest.slug}` },
    other: { "article:modified_time": OPEN_DATA_UPDATED_AT },
  };
}

const OUTLINE: { phase: string; items: string[] }[] = [
  {
    phase: "Before you go",
    items: [
      "Confirm which visa or residency route fits your situation",
      "Gather and, where needed, apostille/translate key documents",
      "Sort out international health insurance for the gap period",
      "Budget the move and notify your bank of the relocation",
    ],
  },
  {
    phase: "First week",
    items: [
      "Register your address with the local authority",
      "Get a local SIM / mobile number",
      "Start the local bank account application",
      "Locate the nearest clinic and pharmacy",
    ],
  },
  {
    phase: "First month",
    items: [
      "Complete residency registration and get your ID number",
      "Enroll in the healthcare system or private insurance",
      "Set up utilities and a long-term rental contract",
      "Understand your tax residency obligations",
    ],
  },
  {
    phase: "First 90 days",
    items: [
      "Exchange or apply for a local driving license if required",
      "Build a local support network and language basics",
      "Review and optimize banking, taxes, and insurance",
      "Handle school enrollment or childcare if you have kids",
    ],
  },
];

interface QuickFact {
  label: string;
  value: string;
  source: string;
  messengers?: MessengerReachability[];
}

// Compact people count: 84512000 -> "84.5M".
function compactPopulation(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return n.toLocaleString("en-US");
}

function quickFacts(name: string): QuickFact[] {
  const ins = insightsForCountry(name);
  const od = openDataForCountry(name);
  const st = staticDataForCountry(name);
  const adv = advisoryForCountry(name);
  const currency = currencyForCountry(name);
  const cen = censorshipForCountry(name);
  const sal = salaryForCountry(name);
  const facts: (QuickFact | null)[] = [
    ins && climateSummary(ins)
      ? {
          label: `Climate · ${ins.capital}`,
          value: climateSummary(ins) as string,
          source: "Open-Meteo",
        }
      : null,
    od?.airQuality
      ? {
          label: `Air quality · ${od.capital}`,
          value: `AQI ${od.airQuality.aqi} · ${aqiLabel(od.airQuality.aqi).text}`,
          source: "WAQI",
        }
      : null,
    od?.priceLevelEU
      ? {
          label: "Prices vs EU average",
          value: `${od.priceLevelEU.value >= 100 ? "+" : "−"}${Math.abs(Math.round(od.priceLevelEU.value - 100))}%`,
          source: `Eurostat ${od.priceLevelEU.year}`,
        }
      : null,
    st
      ? {
          label: "Internet",
          value: `~${st.internetMbps} Mbps median`,
          source: "Ookla",
        }
      : null,
    cen && cen.messengers.length > 0
      ? {
          label: "Messengers",
          value: allMessengersReachable(cen) ? "No known issues" : "",
          source: `OONI, 6 months to ${formatMonth(cen.window.until)}`,
          messengers: cen.messengers,
        }
      : null,
    ins?.migrantShare
      ? {
          label: "Foreign-born residents",
          value: `${ins.migrantShare.value.toFixed(1)}% of population`,
          source: `World Bank ${ins.migrantShare.year}`,
        }
      : null,
    ins?.population
      ? {
          label: "Population",
          value: compactPopulation(ins.population.value),
          source: `World Bank ${ins.population.year}`,
        }
      : null,
    ins?.density
      ? {
          label: "Population density",
          value: `${Math.round(ins.density.value).toLocaleString("en-US")} / km²`,
          source: `World Bank ${ins.density.year}`,
        }
      : null,
    ins?.unemployment
      ? {
          label: "Unemployment",
          value: `${ins.unemployment.value.toFixed(1)}%`,
          source: `World Bank ${ins.unemployment.year}`,
        }
      : null,
    sal?.avgAnnual
      ? {
          label: "Avg advertised salary",
          value: `${formatSalary(sal.avgAnnual, sal.currency)} / yr`,
          source: sal.avgMonth ? `Adzuna, ${formatMonth(sal.avgMonth)}` : "Adzuna",
        }
      : null,
    st
      ? {
          label: "English proficiency",
          value: st.english,
          source: "EF EPI",
        }
      : null,
    adv
      ? {
          label: "Safety advisory",
          value: `Level ${adv.level} · ${adv.label}`,
          source: "U.S. State Dept",
        }
      : null,
    currency
      ? { label: "Currency", value: currency, source: "ISO 4217" }
      : null,
    od?.timezone
      ? { label: "Timezone", value: od.timezone.offset, source: "Open-Meteo" }
      : null,
  ];
  return facts.filter((f): f is QuickFact => f !== null);
}

function faqFor(name: string): { q: string; a: string }[] {
  const ins = insightsForCountry(name);
  const od = openDataForCountry(name);
  const regimes = taxRegimesForCountry(name);
  const cen = censorshipForCountry(name);
  const sal = salaryForCountry(name);
  const faqs: { q: string; a: string }[] = [
    {
      q: `Do I need a visa to move to ${name}?`,
      a: `It depends on your passport and why you are moving: tourist entry rules are different from working, studying or joining family. Generate a free plan above and we check the visa route for your exact passport and situation, using a 238-country visa matrix.`,
    },
  ];
  if (regimes.length > 0) {
    const r = regimes[0];
    faqs.push({
      q: `Does ${name} have a special tax regime for newcomers?`,
      a: `Yes: ${r.name}. ${r.headline}. ${r.detail} Status: ${r.status === "active" ? "active" : r.status === "closed" ? "closed to new applicants" : "recently changed"}, verified ${formatMonth(r.verified)} against ${r.sourceLabel}.`,
    });
  }
  if (ins && climateSummary(ins)) {
    faqs.push({
      q: `What is the weather like in ${name}?`,
      a: `In ${ins.capital}, average daily temperatures run about ${climateSummary(ins)} (Open-Meteo historical data, ${ins.climate.year}). Regional climates can differ a lot; a city-level plan uses data for your exact destination city.`,
    });
  }
  if (cen && cen.messengers.length > 0) {
    const disrupted = disruptedMessengers(cen);
    const reachable = cen.messengers.filter((m) => m.status === "reachable");
    const measured = cen.messengers.map((m) => m.app).join(", ");
    faqs.push({
      q: `Can I use WhatsApp and Telegram in ${name}?`,
      a:
        disrupted.length === 0
          ? `Network measurements over the last six months show ${measured} working normally in ${name} (OONI, ${formatDate(cen.window.since)} to ${formatDate(cen.window.until)}). This reflects measured reachability, not an official policy statement.`
          : reachable.length > 0
            ? `Mostly, but with caveats: OONI network measurements over the last six months report interference with ${disrupted.map((m) => m.app).join(" and ")} in ${name} (${formatDate(cen.window.since)} to ${formatDate(cen.window.until)}). The rest of the measured apps (${reachable.map((m) => m.app).join(", ")}) work normally. This reflects measured reachability, not an official policy statement.`
            : `Expect problems: OONI network measurements over the last six months report interference with ${disrupted.map((m) => m.app).join(" and ")} in ${name} (${formatDate(cen.window.since)} to ${formatDate(cen.window.until)}). Many residents rely on VPNs. This reflects measured reachability, not an official policy statement.`,
    });
  }
  if (sal?.avgAnnual) {
    faqs.push({
      q: `What do jobs pay in ${name}?`,
      a: `The average advertised salary is about ${formatSalary(sal.avgAnnual, sal.currency)} a year (Adzuna job listings, ${formatMonth(sal.avgMonth)}).${sal.benchmarkMedian ? ` For a benchmark role like ${sal.benchmarkRole}, the median advertised band starts around ${formatSalary(sal.benchmarkMedian, sal.currency)}.` : ""} Advertised salaries skew toward roles that are posted online, so treat this as a signal, not a guarantee.`,
    });
  }
  if (od?.taxWedge) {
    faqs.push({
      q: `How high are taxes on salaries in ${name}?`,
      a: `The OECD tax wedge is about ${Math.round(od.taxWedge.value)}% (${od.taxWedge.year}): that is the share of what a job costs an employer that goes to income tax and social contributions for a single average worker. It is not your personal income-tax rate, but it is the honest way to compare countries.`,
    });
  }
  faqs.push({
    q: `How current is this data?`,
    a: `Climate, inflation and life expectancy were refreshed ${formatDate(INSIGHTS_UPDATED_AT)}; prices, taxes and air quality ${formatDate(OPEN_DATA_UPDATED_AT)}; messenger reachability ${formatDate(CENSORSHIP_UPDATED_AT)}. Tax regimes are hand-verified against official government sources. Every fact on this page shows its source.`,
  });
  return faqs;
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
          Everything you need to settle into {dest.name}, organized by phase.
          Generate a free plan tailored to your visa status, family, and
          budget below.
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
              {d.name}
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
