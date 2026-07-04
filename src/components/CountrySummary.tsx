"use client";

import { useState } from "react";
import {
  advisoryForCountry,
  impactForProfile,
  type CountryAdvisory,
} from "@/lib/countryAdvisory";
import { conversionBetween, formatRate } from "@/lib/exchangeRates";
import { currencyForCountry } from "@/lib/countryCurrency";
import { ALL_COUNTRIES } from "@/lib/allCountries";
import { normalizeName } from "@/lib/countryFacts";
import type { Profile, VisaSummary } from "@/lib/types";
import { insightsForCountry, climateSummary } from "@/lib/countryInsights";
import { staticDataForCountry } from "@/lib/staticCountryData";

const FLAG_BY_NAME: Record<string, string> = Object.fromEntries(
  ALL_COUNTRIES.map((c) => [normalizeName(c.name), c.emoji]),
);

const NAME_BY_NORM: Record<string, string> = Object.fromEntries(
  ALL_COUNTRIES.map((c) => [normalizeName(c.name), c.name]),
);

interface Props {
  country: string;
  profile: Profile;
  fromCountry?: string;
  visa?: VisaSummary | null;
}

// Plain-language safety wording; the official label lives in the Safety tab.
const LEVEL_PLAIN: Record<number, { text: string; dot: string; pill: string }> = {
  1: { text: "Generally safe", dot: "bg-emerald-500", pill: "text-emerald-700" },
  2: { text: "Some caution", dot: "bg-amber-500", pill: "text-amber-700" },
  3: { text: "Reconsider travel", dot: "bg-orange-600", pill: "text-orange-700" },
  4: { text: "Do not travel", dot: "bg-red-600", pill: "text-red-700" },
};

function impactDot(level: string): string {
  switch (level.toLowerCase()) {
    case "safe":
    case "low":
      return "bg-emerald-500";
    case "moderate":
    case "medium":
      return "bg-amber-500";
    case "high":
      return "bg-orange-500";
    case "critical":
    case "extreme":
      return "bg-red-500";
    default:
      return "bg-stone-300";
  }
}

const PROFILE_LABEL: Record<Profile, string> = {
  solo: "solo movers",
  couple: "couples",
  family: "families with kids",
  nomad: "remote workers",
  student: "students",
};

function Tile({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent?: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2.5"
      title={hint ?? value}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
        {label}
      </p>
      <p
        className={`tnum mt-0.5 truncate text-sm font-medium ${accent ?? "text-stone-800"}`}
      >
        {value}
      </p>
    </div>
  );
}

type TabKey = "practical" | "cost" | "health" | "safety";

export default function CountrySummary({
  country,
  profile,
  fromCountry,
  visa,
}: Props) {
  const [openTab, setOpenTab] = useState<TabKey | null>(null);
  const advisory: CountryAdvisory | null = advisoryForCountry(country);
  const fx = fromCountry ? conversionBetween(fromCountry, country) : null;
  const currencyCode = currencyForCountry(country);
  const insights = insightsForCountry(country);
  const staticData = staticDataForCountry(country);
  const climate = insights ? climateSummary(insights) : null;
  const visaValue = visa
    ? visa.days != null
      ? `Visa-free · ${visa.days}d`
      : visa.label
    : null;
  const today = new Date().toISOString().slice(0, 10);
  const nextHolidays =
    insights?.holidays?.sample.filter((h) => h.date >= today).slice(0, 3) ?? [];
  // Big Mac price alone is noise; compare against the origin when we can.
  const originInsights = fromCountry ? insightsForCountry(fromCountry) : null;
  const priceLevel = (() => {
    const dest = insights?.bigMacUsd?.value;
    if (!dest) return null;
    const origin = originInsights?.bigMacUsd?.value;
    if (origin && fromCountry) {
      const pct = Math.round(((dest - origin) / origin) * 100);
      if (pct === 0) return { value: "Similar prices", hint: `Big Mac index vs ${fromCountry}` };
      return {
        value: `${pct > 0 ? "+" : ""}${pct}% vs home`,
        hint: `Big Mac index: $${dest} here vs $${origin} in ${fromCountry}`,
      };
    }
    return { value: `Big Mac ~$${dest}`, hint: "Big Mac index (The Economist)" };
  })();
  const fmtDate = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  // Nothing worth showing at all.
  if (!advisory && !fx && !currencyCode && !visa && !insights && !staticData)
    return null;

  const norm = normalizeName(country);
  const name = advisory?.name ?? NAME_BY_NORM[norm] ?? country;
  const flag = advisory?.flag ?? FLAG_BY_NAME[norm] ?? "🌍";

  const plain = advisory ? LEVEL_PLAIN[advisory.level] ?? LEVEL_PLAIN[1] : null;
  const impact = advisory ? impactForProfile(advisory, profile) : null;
  const vac = advisory?.vaccinations ?? null;
  // Reasons may arrive as machine codes (e.g. "civil_unrest").
  const humanize = (r: string) =>
    r.includes("_") || r === r.toLowerCase()
      ? r.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())
      : r;
  const reasons = advisory
    ? advisory.reasons.slice(0, 3).map(humanize).join(" · ")
    : "";

  const warnings = advisory
    ? [
        ...advisory.doNotTravel.map((d) => `Do not travel: ${d}`),
        ...advisory.restrictions,
        ...(advisory.stateOfEmergency ? ["State of emergency declared"] : []),
        ...(advisory.consularSupport.limited
          ? ["Limited consular / emergency services"]
          : []),
      ].slice(0, 3)
    : [];

  const hasHealth = Boolean(
    vac &&
      (vac.required.length > 0 ||
        vac.recommended.length > 0 ||
        vac.malaria ||
        vac.healthNotices.length > 0),
  );
  const hasCost = Boolean(
    insights &&
      (insights.inflation || priceLevel || insights.lifeExpectancy),
  );
  const hasPractical = Boolean(staticData || nextHolidays.length > 0);
  const hasSafety = Boolean(advisory && (reasons || impact?.detail || advisory.stateDeptUrl));

  // One combined money tile instead of separate currency and FX tiles.
  const currencyValue = advisory?.entryExit.currency ?? currencyCode ?? null;
  const moneyValue = currencyValue
    ? fx
      ? `${fx.toCode} · 1 ${fx.fromCode} ≈ ${formatRate(fx.rate)}`
      : currencyValue
    : fx
      ? `1 ${fx.fromCode} ≈ ${formatRate(fx.rate)} ${fx.toCode}`
      : null;

  // One combined language tile: local language plus English level.
  const language = advisory?.entryExit.language ?? null;
  const english = staticData
    ? staticData.english.charAt(0).toUpperCase() + staticData.english.slice(1)
    : null;
  const languageValue = language
    ? english && !language.toLowerCase().includes("english")
      ? `${language} · English ${english.toLowerCase()}`
      : language
    : english
      ? `English ${english.toLowerCase()}`
      : null;

  const tabs: { key: TabKey; label: string; show: boolean }[] = [
    { key: "practical", label: "Practical", show: hasPractical },
    { key: "cost", label: "Cost of living", show: hasCost },
    { key: "health", label: "Health", show: hasHealth },
    { key: "safety", label: "Safety", show: hasSafety },
  ];
  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <section
      className="reveal mt-5 rounded-xl border border-stone-200 bg-white p-5"
      aria-label={`Country snapshot for ${name}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none" aria-hidden>
            {flag}
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
              Country snapshot
            </p>
            <h3 className="text-base font-semibold text-stone-900">{name}</h3>
          </div>
        </div>
        {plain && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium ${plain.pill}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${plain.dot}`} />
            {plain.text}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {visaValue ? (
          <Tile
            label="Short-stay visa"
            value={visaValue}
            accent={
              visa?.category === "visa-free"
                ? "text-emerald-700"
                : "text-amber-700"
            }
          />
        ) : (
          advisory &&
          advisory.entryExit.visaRequired !== null && (
            <Tile
              label="Visa"
              value={
                advisory.entryExit.visaRequired ? "Required" : "Not required"
              }
              accent={
                advisory.entryExit.visaRequired
                  ? "text-amber-700"
                  : "text-emerald-700"
              }
            />
          )
        )}
        {moneyValue && <Tile label="Money" value={moneyValue} />}
        {languageValue && <Tile label="Language" value={languageValue} />}
        {climate && insights && (
          <Tile label={`Climate · ${insights.climate.city}`} value={climate} />
        )}
      </div>

      {/* Critical warnings are never hidden behind a tab. */}
      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-3">
          {warnings.map((w, i) => (
            <li key={i} className="text-sm text-amber-800">
              {w}
            </li>
          ))}
        </ul>
      )}

      {visibleTabs.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5" role="tablist">
            {visibleTabs.map((t) => {
              const active = openTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setOpenTab(active ? null : t.key)}
                  className={`pressable rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white text-stone-500 hover:text-stone-900"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {openTab === "practical" && hasPractical && (
            <div className="mt-2.5 space-y-2.5">
              {staticData && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Tile label="Internet" value={`~${staticData.internetMbps} Mbps`} />
                  <Tile
                    label="Plugs"
                    value={`Type ${staticData.plugTypes.join("/")} · ${staticData.voltage}`}
                  />
                </div>
              )}
              {nextHolidays.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                    Upcoming public holidays · offices closed
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {nextHolidays.map((h) => (
                      <span
                        key={h.date}
                        className="inline-flex items-center gap-1.5 rounded border border-stone-200 bg-white px-2 py-1 text-xs text-stone-600"
                      >
                        <span className="font-medium text-stone-800">
                          {fmtDate(h.date)}
                        </span>
                        {h.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {openTab === "cost" && insights && (
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {priceLevel && (
                <Tile label="Price level" value={priceLevel.value} hint={priceLevel.hint} />
              )}
              {insights.inflation && (
                <Tile
                  label={`Inflation · ${insights.inflation.year}`}
                  value={`${insights.inflation.value.toFixed(1)}% / yr`}
                />
              )}
              {insights.lifeExpectancy && (
                <Tile
                  label="Life expectancy"
                  value={`${insights.lifeExpectancy.value.toFixed(0)} yrs`}
                />
              )}
            </div>
          )}

          {openTab === "health" && vac && (
            <div className="mt-2.5">
              {(vac.required.length > 0 || vac.recommended.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {vac.required.map((v) => (
                    <span
                      key={v.name}
                      className="inline-flex items-center rounded border border-amber-200 bg-white px-2 py-1 text-xs font-medium text-amber-800"
                    >
                      {v.name} · required
                    </span>
                  ))}
                  {vac.recommended.map((v) => (
                    <span
                      key={v.name}
                      className="inline-flex items-center rounded border border-stone-200 bg-white px-2 py-1 text-xs text-stone-600"
                    >
                      {v.name}
                    </span>
                  ))}
                </div>
              )}
              {vac.malaria && (
                <p className="mt-2 text-sm text-stone-600">
                  <span className="font-medium text-stone-800">Malaria:</span>{" "}
                  {vac.malaria.riskLevel} risk
                  {vac.malaria.medications.length > 0
                    ? ` · prophylaxis: ${vac.malaria.medications.join(", ")}`
                    : ""}
                </p>
              )}
              {vac.healthNotices.map((n, i) => (
                <p key={i} className="mt-1.5 text-sm text-amber-800">
                  <span>
                    <span className="font-medium">{n.title}</span>
                    {n.summary ? ` — ${n.summary}` : ""}
                  </span>
                </p>
              ))}
              <p className="mt-2 text-xs text-stone-400">Source: CDC</p>
            </div>
          )}

          {openTab === "safety" && advisory && (
            <div className="mt-2.5 space-y-2.5">
              <p className="text-sm text-stone-600">
                <span className="font-medium text-stone-800">
                  Level {advisory.level} · {advisory.label}
                </span>
                {reasons ? ` — ${reasons}` : ""}
              </p>
              {impact?.detail && (
                <div className="flex items-start gap-2.5 rounded-md border border-stone-200 bg-stone-50 p-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${impactDot(impact.level)}`}
                    aria-hidden
                  />
                  <p className="text-sm text-stone-600">
                    <span className="font-medium text-stone-800">
                      For {PROFILE_LABEL[profile]}
                    </span>{" "}
                    <span className="text-stone-400">({impact.level} risk)</span>{" "}
                    — {impact.detail}
                  </p>
                </div>
              )}
              {advisory.stateDeptUrl && (
                <a
                  href={advisory.stateDeptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-medium text-stone-500 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
                >
                  Full U.S. State Dept advisory
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-400">
        <span>
          {advisory ? "Sources: U.S. State Dept" : "Sources: open data"}
          {visa ? " · Passport Index" : ""}
          {insights ? " · Open-Meteo · World Bank" : ""}
          {advisory?.updatedAt ? ` · updated ${advisory.updatedAt}` : ""}
          {fx && fx.updatedAt ? ` · FX ${fx.updatedAt}` : ""}
        </span>
      </div>
    </section>
  );
}
