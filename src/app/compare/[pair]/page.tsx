import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DESTINATIONS, type Destination } from "@/lib/countries";
import {
  insightsForCountry,
  climateSummary,
  INSIGHTS_UPDATED_AT,
  type CountryInsights,
} from "@/lib/countryInsights";
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
  type CountryCensorship,
} from "@/lib/countryCensorship";
import { salaryForCountry, formatSalary } from "@/lib/countrySalaries";
import {
  cryptoShortStatus,
  cryptoTaxForCountry,
  formatCryptoRate,
  CRYPTO_TAX_DATASET_URL,
  CRYPTO_TAX_UPDATED_AT,
  type CryptoTaxRegime,
} from "@/lib/cryptoTax";
import { formatMonth, formatDate } from "@/lib/dates";
import SiteFooter from "@/components/SiteFooter";
import CompareClimateRows from "@/components/CompareClimateRows";
import { SITE_URL } from "@/lib/siteUrls";

interface Params {
  pair: string;
}

// Canonical pair order follows the DESTINATIONS array, so each comparison
// exists at exactly one URL (no duplicate content).
function canonicalPairs(): { a: Destination; b: Destination }[] {
  const pairs: { a: Destination; b: Destination }[] = [];
  for (let i = 0; i < DESTINATIONS.length; i++) {
    for (let j = i + 1; j < DESTINATIONS.length; j++) {
      pairs.push({ a: DESTINATIONS[i], b: DESTINATIONS[j] });
    }
  }
  return pairs;
}

function parsePair(pair: string): { a: Destination; b: Destination } | null {
  const idx = pair.indexOf("-vs-");
  if (idx === -1) return null;
  const aSlug = pair.slice(0, idx);
  const bSlug = pair.slice(idx + 4);
  const found = canonicalPairs().find(
    (p) => p.a.slug === aSlug && p.b.slug === bSlug,
  );
  return found ?? null;
}

export function generateStaticParams(): Params[] {
  return canonicalPairs().map((p) => ({ pair: `${p.a.slug}-vs-${p.b.slug}` }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) return {};
  const title = `${parsed.a.name} vs ${parsed.b.name}: cost, climate, taxes, safety`;
  const description = `Compare moving to ${parsed.a.name} vs ${parsed.b.name}: cost of living signals, climate, air quality, taxes and special regimes, internet, safety. Live data with sources.`;
  return {
    title,
    description,
    alternates: { canonical: `/compare/${pair}` },
    openGraph: { title, description, url: `/compare/${pair}` },
    other: { "article:modified_time": OPEN_DATA_UPDATED_AT },
  };
}

interface Row {
  label: string;
  a: string | null;
  b: string | null;
  aTone?: string;
  bTone?: string;
  source: string;
  sourceUrl?: string;
}

function buildRows(a: Destination, b: Destination): Row[] {
  const insA = insightsForCountry(a.name);
  const insB = insightsForCountry(b.name);
  const odA = openDataForCountry(a.name);
  const odB = openDataForCountry(b.name);
  const stA = staticDataForCountry(a.name);
  const stB = staticDataForCountry(b.name);
  const advA = advisoryForCountry(a.name);
  const advB = advisoryForCountry(b.name);
  const regA = taxRegimesForCountry(a.name);
  const regB = taxRegimesForCountry(b.name);
  const cenA = censorshipForCountry(a.name);
  const cenB = censorshipForCountry(b.name);
  const salA = salaryForCountry(a.name);
  const salB = salaryForCountry(b.name);

  const messengerSummary = (c: CountryCensorship | null): string | null => {
    if (!c || c.messengers.length === 0) return null;
    if (allMessengersReachable(c)) return "No known issues";
    return `Issues: ${disruptedMessengers(c)
      .map((m) => m.app)
      .join(", ")}`;
  };

  const aqiTone = (aqi: number | undefined | null): string | undefined => {
    if (aqi == null) return undefined;
    const t = aqiLabel(aqi).tone;
    return t === "good"
      ? "text-emerald-700"
      : t === "moderate"
        ? "text-amber-700"
        : "text-red-700";
  };

  const rows: Row[] = [
    {
      label: "Air quality (capital)",
      a: odA?.airQuality
        ? `AQI ${odA.airQuality.aqi} · ${aqiLabel(odA.airQuality.aqi).text}`
        : null,
      b: odB?.airQuality
        ? `AQI ${odB.airQuality.aqi} · ${aqiLabel(odB.airQuality.aqi).text}`
        : null,
      aTone: aqiTone(odA?.airQuality?.aqi),
      bTone: aqiTone(odB?.airQuality?.aqi),
      source: "WAQI, capital station",
    },
    {
      label: "Prices vs EU average",
      a: odA?.priceLevelEU
        ? `${odA.priceLevelEU.value >= 100 ? "+" : "−"}${Math.abs(Math.round(odA.priceLevelEU.value - 100))}% (${odA.priceLevelEU.year})`
        : null,
      b: odB?.priceLevelEU
        ? `${odB.priceLevelEU.value >= 100 ? "+" : "−"}${Math.abs(Math.round(odB.priceLevelEU.value - 100))}% (${odB.priceLevelEU.year})`
        : null,
      source: "Eurostat price level index, EU27 = 100",
    },
    {
      label: "Big Mac price",
      a: insA?.bigMacUsd ? `$${insA.bigMacUsd.value.toFixed(2)}` : null,
      b: insB?.bigMacUsd ? `$${insB.bigMacUsd.value.toFixed(2)}` : null,
      source:
        "The Economist Big Mac index (euro-area countries share one euro-area price)",
    },
    {
      label: "Employment taxes (not your rate)",
      a: odA?.taxWedge
        ? `~${Math.round(odA.taxWedge.value)}% of what a job costs goes to tax (${odA.taxWedge.year})`
        : null,
      b: odB?.taxWedge
        ? `~${Math.round(odB.taxWedge.value)}% of what a job costs goes to tax (${odB.taxWedge.year})`
        : null,
      source: "OECD tax wedge, single average worker",
    },
    {
      label: "Special tax regimes",
      a: regA.length > 0 ? regA.map((r) => r.name).join(" · ") : "None curated",
      b: regB.length > 0 ? regB.map((r) => r.name).join(" · ") : "None curated",
      source: `Official tax authorities, verified ${formatMonth(regA[0]?.verified ?? regB[0]?.verified ?? INSIGHTS_UPDATED_AT)}`,
    },
    {
      label: "Avg advertised salary",
      a:
        salA?.avgAnnual && salB?.avgAnnual
          ? `${formatSalary(salA.avgAnnual, salA.currency)} / yr (${formatMonth(salA.avgMonth)})`
          : null,
      b:
        salA?.avgAnnual && salB?.avgAnnual
          ? `${formatSalary(salB.avgAnnual, salB.currency)} / yr (${formatMonth(salB.avgMonth)})`
          : null,
      source: "Adzuna job listings, local currency",
    },
    {
      label: "Inflation",
      a: insA?.inflation
        ? `${insA.inflation.value.toFixed(1)}% / yr (${insA.inflation.year})`
        : null,
      b: insB?.inflation
        ? `${insB.inflation.value.toFixed(1)}% / yr (${insB.inflation.year})`
        : null,
      source: "World Bank",
    },
    {
      label: "Internet (median fixed)",
      a: stA ? `~${stA.internetMbps} Mbps` : null,
      b: stB ? `~${stB.internetMbps} Mbps` : null,
      source: "Ookla Speedtest Global Index",
    },
    {
      label: "English proficiency",
      a: stA ? stA.english : null,
      b: stB ? stB.english : null,
      source: "EF English Proficiency Index",
    },
    {
      label: "Messenger apps",
      a: messengerSummary(cenA) && messengerSummary(cenB) ? messengerSummary(cenA) : null,
      b: messengerSummary(cenA) && messengerSummary(cenB) ? messengerSummary(cenB) : null,
      aTone:
        cenA && !allMessengersReachable(cenA) ? "text-amber-700" : undefined,
      bTone:
        cenB && !allMessengersReachable(cenB) ? "text-amber-700" : undefined,
      source: "OONI network measurements, last 6 months",
    },
    {
      label: "Safety advisory",
      a: advA ? `Level ${advA.level} · ${advA.label}` : null,
      b: advB ? `Level ${advB.level} · ${advB.label}` : null,
      aTone: advA && advA.level >= 3 ? "text-red-700" : undefined,
      bTone: advB && advB.level >= 3 ? "text-red-700" : undefined,
      source: "U.S. State Department travel advisory",
    },
    {
      label: "Foreign-born residents",
      a: insA?.migrantShare
        ? `${insA.migrantShare.value.toFixed(1)}% of population (${insA.migrantShare.year})`
        : null,
      b: insB?.migrantShare
        ? `${insB.migrantShare.value.toFixed(1)}% of population (${insB.migrantShare.year})`
        : null,
      source: "World Bank migrant stock",
    },
    {
      label: "Life expectancy",
      a: insA?.lifeExpectancy ? `${insA.lifeExpectancy.value.toFixed(0)} yrs` : null,
      b: insB?.lifeExpectancy ? `${insB.lifeExpectancy.value.toFixed(0)} yrs` : null,
      source: "WHO",
    },
    {
      label: "Currency",
      a: currencyForCountry(a.name),
      b: currencyForCountry(b.name),
      source: "ISO 4217",
    },
    {
      label: "Timezone (capital)",
      a: odA?.timezone ? odA.timezone.offset : null,
      b: odB?.timezone ? odB.timezone.offset : null,
      source: "Open-Meteo",
    },
  ];

  return rows.filter((r) => r.a !== null || r.b !== null);
}

export default async function ComparePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) notFound();
  const { a, b } = parsed;
  const rows = buildRows(a, b);

  // Climate + sunny days: curated where available, otherwise filled live from
  // Open-Meteo on the client (same source the plan uses), so non-curated
  // countries stop showing "—" for climate.
  const insCA = insightsForCountry(a.name);
  const insCB = insightsForCountry(b.name);
  const odCA = openDataForCountry(a.name);
  const odCB = openDataForCountry(b.name);
  const curatedClimate = (
    ins: CountryInsights | null,
    capital: string | undefined,
  ): string | null => {
    const summary = ins ? climateSummary(ins) : null;
    return summary && capital ? `${summary} · ${capital}` : null;
  };
  const curatedSunny = (ins: CountryInsights | null): string | null =>
    ins?.climate.sunnyDays != null ? `${ins.climate.sunnyDays} days / yr` : null;
  const cryptoA = cryptoTaxForCountry(a.name);
  const cryptoB = cryptoTaxForCountry(b.name);
  const cryptoField = (
    r: CryptoTaxRegime | null,
    pick: (x: CryptoTaxRegime) => number | null,
  ) => (r ? formatCryptoRate(pick(r)) : "—");
  const cryptoHoldField = (r: CryptoTaxRegime | null) =>
    r?.holdingPeriodMonths ? `${r.holdingPeriodMonths}mo` : "—";
  // Each country carries its own holding period, so the boundary is shown as
  // its own row rather than baked into a shared gains label (the periods can
  // differ, e.g. 12mo vs 24mo).
  const cryptoRows =
    cryptoA || cryptoB
      ? [
          {
            label: "Short-term gains",
            a: cryptoField(cryptoA, (x) => x.shortTermRate),
            b: cryptoField(cryptoB, (x) => x.shortTermRate),
          },
          {
            label: "Long-term gains",
            a: cryptoField(cryptoA, (x) => x.longTermRate),
            b: cryptoField(cryptoB, (x) => x.longTermRate),
          },
          {
            label: "Long-term holding period",
            a: cryptoHoldField(cryptoA),
            b: cryptoHoldField(cryptoB),
          },
          {
            label: "Staking income",
            a: cryptoField(cryptoA, (x) => x.stakingRate),
            b: cryptoField(cryptoB, (x) => x.stakingRate),
          },
          {
            label: "Mining income",
            a: cryptoField(cryptoA, (x) => x.miningRate),
            b: cryptoField(cryptoB, (x) => x.miningRate),
          },
        ]
      : [];
  const regimes = [
    ...taxRegimesForCountry(a.name).map((r) => ({ country: a, r })),
    ...taxRegimesForCountry(b.name).map((r) => ({ country: b, r })),
  ];
  const pageUrl = `${SITE_URL}/compare/${pair}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Reloka", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Compare countries",
            item: `${SITE_URL}/compare`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${a.name} vs ${b.name}`,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        name: `${a.name} vs ${b.name}: cost, climate, taxes, safety`,
        url: pageUrl,
        dateModified: OPEN_DATA_UPDATED_AT,
        isPartOf: { "@id": `${SITE_URL}/#website` },
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
          href="/compare"
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← All comparisons
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          {a.emoji} {a.name} vs {b.emoji} {b.name}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
          Side by side on the data that actually changes your life: prices,
          taxes, climate, air, safety. Every number has a source and a date.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-10">
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-900">
            <span />
            <span>
              {a.emoji} {a.name}
            </span>
            <span>
              {b.emoji} {b.name}
            </span>
          </div>
          <CompareClimateRows
            aName={a.name}
            bName={b.name}
            aCapital={odCA?.capital ?? null}
            bCapital={odCB?.capital ?? null}
            aClimate={curatedClimate(insCA, insCA?.capital)}
            bClimate={curatedClimate(insCB, insCB?.capital)}
            aSunny={curatedSunny(insCA)}
            bSunny={curatedSunny(insCB)}
          />
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1.2fr_1fr_1fr] items-start border-b border-stone-100 px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-stone-700">{row.label}</p>
                {row.sourceUrl ? (
                  <a
                    href={row.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-[11px] text-stone-400 underline decoration-stone-200 underline-offset-2 transition-colors hover:text-stone-700"
                  >
                    {row.source}
                  </a>
                ) : (
                  <p className="mt-0.5 text-[11px] text-stone-400">{row.source}</p>
                )}
              </div>
              <p className={`tnum pr-2 text-sm ${row.aTone ?? "text-stone-800"}`}>
                {row.a ?? "—"}
              </p>
              <p className={`tnum text-sm ${row.bTone ?? "text-stone-800"}`}>
                {row.b ?? "—"}
              </p>
            </div>
          ))}
          {cryptoRows.length > 0 && (
            <details className="group border-b border-stone-100 last:border-b-0">
              <summary className="grid cursor-pointer list-none grid-cols-[1.2fr_1fr_1fr] items-start px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                <div>
                  <p className="flex items-center gap-1 text-sm font-medium text-stone-700">
                    Crypto taxes
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden
                      className="h-3.5 w-3.5 text-stone-400 transition-transform group-open:rotate-180"
                    >
                      <path
                        d="m6 9 6 6 6-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </p>
                  <a
                    href={CRYPTO_TAX_DATASET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-[11px] text-stone-400 underline decoration-stone-200 underline-offset-2 transition-colors hover:text-stone-700"
                  >
                    CryptoNomadHub, updated {formatDate(CRYPTO_TAX_UPDATED_AT)} · CC BY 4.0
                  </a>
                </div>
                <p className="tnum pr-2 text-sm text-stone-800">
                  {cryptoA ? cryptoShortStatus(cryptoA) : "—"}
                </p>
                <p className="tnum text-sm text-stone-800">
                  {cryptoB ? cryptoShortStatus(cryptoB) : "—"}
                </p>
              </summary>
              <div className="px-4 pb-3">
                {cryptoRows.map((r) => (
                  <div
                    key={r.label}
                    className="grid grid-cols-[1.2fr_1fr_1fr] items-start border-t border-stone-100 py-2"
                  >
                    <p className="text-xs text-stone-500">{r.label}</p>
                    <p className="tnum pr-2 text-sm text-stone-800">{r.a}</p>
                    <p className="tnum text-sm text-stone-800">{r.b}</p>
                  </div>
                ))}
                <p className="mt-2 text-[11px] text-stone-400">
                  General rates, not personal tax advice.
                </p>
              </div>
            </details>
          )}
        </div>
        <p className="mt-3 text-xs text-stone-400">
          Climate, inflation and life expectancy verified {formatDate(INSIGHTS_UPDATED_AT)}.
          Prices, taxes and air quality verified {formatDate(OPEN_DATA_UPDATED_AT)}. Sources
          shown per row.
        </p>
      </section>

      {regimes.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-10">
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">
            Special tax regimes, verified
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Regimes change often and many sites still advertise closed ones. We
            link the official source for each.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {regimes.map(({ country, r }) => (
              <div
                key={`${country.slug}-${r.name}`}
                className="rounded-lg border border-stone-200 bg-white px-4 py-3"
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                  {country.emoji} {country.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-stone-900">
                    {r.name}
                  </span>
                  {r.status !== "active" && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      {r.status === "closed" ? "Closed" : "Recently changed"}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-stone-700">{r.headline}</p>
                <p className="mt-1.5 text-[11px] text-stone-400">
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
        </section>
      )}

      <section className="mx-auto max-w-3xl px-4 pb-12 text-center">
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-6 py-8">
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">
            Numbers are half the story
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
            Your visa route, paperwork and deadlines depend on where you hold a
            passport. Get a free checklist personalized to your exact move.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/plan"
              className="pressable rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
            >
              Build my free plan
            </Link>
            <Link
              href={`/moving-to/${a.slug}`}
              className="pressable rounded-md border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              Moving to {a.name}
            </Link>
            <Link
              href={`/moving-to/${b.slug}`}
              className="pressable rounded-md border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              Moving to {b.name}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
