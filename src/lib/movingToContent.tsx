// Shared content helpers for the /moving-to pages (base country page and the
// "from USA" variant). Keeps the data-assembly and fact rendering in one place
// so the two page types stay consistent instead of duplicating logic.

import React from "react";
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
import type { MessengerReachability } from "@/lib/countryCensorship";

export interface QuickFact {
  label: string;
  value: string;
  source: string;
  messengers?: MessengerReachability[];
}

export const OUTLINE: { phase: string; items: string[] }[] = [
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

// Compact people count: 84512000 -> "84.5M".
function compactPopulation(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return n.toLocaleString("en-US");
}

export function quickFacts(name: string): QuickFact[] {
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

// A short, country-specific lead sentence built from data already shown on the
// page, so every destination gets a unique intro instead of the same template.
// Uses only unambiguous figures; the tax regime has its own section below.
export function introHighlights(name: string): string {
  const sal = salaryForCountry(name);
  const st = staticDataForCountry(name);
  const od = openDataForCountry(name);
  const parts: string[] = [];
  if (od?.priceLevelEU) {
    const diff = Math.round(od.priceLevelEU.value - 100);
    parts.push(
      `consumer prices run about ${Math.abs(diff)}% ${diff >= 0 ? "above" : "below"} the EU average`,
    );
  }
  if (sal?.avgAnnual) {
    parts.push(
      `the average advertised salary is about ${formatSalary(sal.avgAnnual, sal.currency)} a year`,
    );
  }
  if (st) {
    parts.push(`English proficiency is rated “${st.english}” (EF EPI)`);
  }
  if (parts.length === 0) return "";
  const joined =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`;
}

// The curated COUNTRY_FACTS are written as instructions for the generation
// model, so they carry a few model-directed clauses. Strip those so the text
// reads naturally for a human; the figures/institutions are kept verbatim.
function sanitizeFact(fact: string): string {
  return fact
    .replaceAll("tell the user to ", "")
    .replace(
      " Never refer to SEF as current, and never link to acm.gov.pt for residency.",
      "",
    )
    .replace(" — don't conflate them.", ".")
    .replace(/\bREPLACED\b/g, "replaced")
    .replace(/\bSTARTED\b/g, "started")
    .replace(/\s+/g, " ")
    .trim();
}

const FACT_URL_RE = /(https?:\/\/[^\s)]+)/g;

// Render a fact string, turning inline official URLs into links that show a
// readable hostname (e.g. "aima.gov.pt") instead of the raw URL.
export function renderFact(fact: string): React.ReactNode[] {
  return sanitizeFact(fact)
    .split(FACT_URL_RE)
    .map((part, i) => {
      if (/^https?:\/\//.test(part)) {
        const label = part.replace(/^https?:\/\//, "").replace(/\/+$/, "");
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
          >
            {label}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
}

export function faqFor(name: string): { q: string; a: string }[] {
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
