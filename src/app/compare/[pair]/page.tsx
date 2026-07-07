import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DESTINATIONS, type Destination } from "@/lib/countries";
import { insightsForCountry, climateSummary, INSIGHTS_UPDATED_AT } from "@/lib/countryInsights";
import { openDataForCountry, aqiLabel } from "@/lib/countryOpenData";
import { OPEN_DATA_UPDATED_AT } from "@/lib/countryOpenData.generated";
import { staticDataForCountry } from "@/lib/staticCountryData";
import { advisoryForCountry } from "@/lib/countryAdvisory";
import { taxRegimesForCountry } from "@/lib/taxRegimes";
import { currencyForCountry } from "@/lib/countryCurrency";

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
  };
}

interface Row {
  label: string;
  a: string | null;
  b: string | null;
  aTone?: string;
  bTone?: string;
  source: string;
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
      label: "Climate (capital)",
      a: insA ? `${climateSummary(insA) ?? ""} · ${insA.capital}` : null,
      b: insB ? `${climateSummary(insB) ?? ""} · ${insB.capital}` : null,
      source: "Open-Meteo historical weather",
    },
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
      source: "The Economist Big Mac index",
    },
    {
      label: "Taxes on salary",
      a: odA?.taxWedge
        ? `~${Math.round(odA.taxWedge.value)}% of labour cost (${odA.taxWedge.year})`
        : null,
      b: odB?.taxWedge
        ? `~${Math.round(odB.taxWedge.value)}% of labour cost (${odB.taxWedge.year})`
        : null,
      source: "OECD tax wedge, single average worker",
    },
    {
      label: "Special tax regimes",
      a: regA.length > 0 ? regA.map((r) => r.name).join(" · ") : "None curated",
      b: regB.length > 0 ? regB.map((r) => r.name).join(" · ") : "None curated",
      source: `Official tax authorities, verified ${regA[0]?.verified ?? regB[0]?.verified ?? INSIGHTS_UPDATED_AT.slice(0, 7)}`,
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
      label: "Safety advisory",
      a: advA ? `Level ${advA.level} · ${advA.label}` : null,
      b: advB ? `Level ${advB.level} · ${advB.label}` : null,
      aTone: advA && advA.level >= 3 ? "text-red-700" : undefined,
      bTone: advB && advB.level >= 3 ? "text-red-700" : undefined,
      source: "U.S. State Department travel advisory",
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
  const regimes = [
    ...taxRegimesForCountry(a.name).map((r) => ({ country: a, r })),
    ...taxRegimesForCountry(b.name).map((r) => ({ country: b, r })),
  ];

  return (
    <main className="flex-1">
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
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1.2fr_1fr_1fr] items-start border-b border-stone-100 px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-stone-700">{row.label}</p>
                <p className="mt-0.5 text-[11px] text-stone-400">{row.source}</p>
              </div>
              <p className={`tnum pr-2 text-sm ${row.aTone ?? "text-stone-800"}`}>
                {row.a ?? "—"}
              </p>
              <p className={`tnum text-sm ${row.bTone ?? "text-stone-800"}`}>
                {row.b ?? "—"}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-400">
          Climate, inflation and life expectancy verified {INSIGHTS_UPDATED_AT}.
          Prices, taxes and air quality verified {OPEN_DATA_UPDATED_AT}. Sources
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
                  Verified {r.verified} ·{" "}
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

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-400">
        ReloChecklist · Not legal, tax or immigration advice. Always verify
        official requirements.
      </footer>
    </main>
  );
}
