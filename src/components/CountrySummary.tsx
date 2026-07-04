"use client";

import { useState } from "react";
import {
  advisoryForCountry,
  impactForProfile,
  type CountryAdvisory,
} from "@/lib/countryAdvisory";
import { conversionBetween, formatRate, EXCHANGE_RATES } from "@/lib/exchangeRates";
import { currencyForCountry } from "@/lib/countryCurrency";
import { originForCountry } from "@/lib/countryOrigin";
import { useLiveRates } from "@/lib/useLiveRates";
import { ALL_COUNTRIES } from "@/lib/allCountries";
import { normalizeName } from "@/lib/countryFacts";
import type { Profile, VisaSummary } from "@/lib/types";
import { insightsForCountry, climateSummary } from "@/lib/countryInsights";
import { staticDataForCountry } from "@/lib/staticCountryData";
import { openDataForCountry, aqiLabel } from "@/lib/countryOpenData";

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

type IconName =
  | "visa"
  | "money"
  | "language"
  | "climate"
  | "air"
  | "prices"
  | "tax"
  | "clock";

const ICON_PATHS: Record<IconName, string> = {
  visa: "M4 3.5h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Zm2 3.5h4M6 9.5h4M6 12h2.5",
  money: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 2.5v6m1.8-4.6c-.3-.5-1-.9-1.8-.9-1 0-1.8.6-1.8 1.3 0 1.8 3.6.9 3.6 2.6 0 .7-.8 1.3-1.8 1.3-.8 0-1.5-.4-1.8-.9",
  language: "M2.5 4h7M6 2.5V4m2.5 0c-.7 2.6-2.7 4.8-5.5 6m1.2-3.5c.9 1.8 2.6 3.2 4.3 3.9M9.5 13.5 12 7l2.5 6.5m-4.3-2h3.6",
  climate: "M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8m9.4 0h1.8M3.4 3.4l1.3 1.3m6.6 6.6 1.3 1.3m0-9.2-1.3 1.3M4.7 11.3l-1.3 1.3M8 5.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6Z",
  air: "M2 5.5h7a2 2 0 1 0-2-2M2 8.5h10a2 2 0 1 1-2 2M2 11.5h4.5a1.8 1.8 0 1 1-1.8 1.8",
  prices: "M2.8 8.6 8.6 2.8a1 1 0 0 1 .7-.3h3.2a1 1 0 0 1 1 1v3.2a1 1 0 0 1-.3.7l-5.8 5.8a1 1 0 0 1-1.4 0L2.8 10a1 1 0 0 1 0-1.4ZM11 5h.01",
  tax: "M3.5 12.5 12.5 3.5M5 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
  clock: "M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2Zm0 2.5V8l2.5 1.5",
};

function CellIcon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0 text-stone-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

interface BentoCell {
  key: string;
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  hint?: string;
  wide?: boolean;
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
  const liveRates = useLiveRates();
  const fx = fromCountry
    ? conversionBetween(fromCountry, country, liveRates)
    : null;
  const currencyCode = currencyForCountry(country);
  const insights = insightsForCountry(country);
  const staticData = staticDataForCountry(country);
  const openData = openDataForCountry(country);
  const climate = insights ? climateSummary(insights) : null;
  const visaValue = visa
    ? visa.days != null
      ? `Visa-free · ${visa.days}d`
      : visa.label
    : null;
  const today = new Date().toISOString().slice(0, 10);
  const nextHolidays =
    insights?.holidays?.sample.filter((h) => h.date >= today).slice(0, 3) ?? [];
  // Big Mac price alone is noise; compare against the origin when we can,
  // or at least quote it in the origin currency so it reads as a home price.
  const originInsights = fromCountry ? insightsForCountry(fromCountry) : null;
  const originCurrency = fromCountry ? currencyForCountry(fromCountry) : null;
  const priceLevel = (() => {
    const dest = insights?.bigMacUsd?.value;
    if (!dest) return null;
    const origin = originInsights?.bigMacUsd?.value;
    if (origin && fromCountry) {
      const pct = Math.round(((dest - origin) / origin) * 100);
      if (pct === 0) return { value: "Similar prices", sub: undefined, hint: `Big Mac index vs ${fromCountry}` };
      return {
        value: `${pct > 0 ? "+" : ""}${pct}% vs home`,
        sub: undefined,
        hint: `Big Mac index: $${dest} here vs $${origin} in ${fromCountry}`,
      };
    }
    const usdToOrigin =
      originCurrency && originCurrency !== "USD"
        ? (liveRates ?? EXCHANGE_RATES).rates[originCurrency]
        : null;
    if (usdToOrigin) {
      const home = (dest * usdToOrigin).toLocaleString("en-US", {
        style: "currency",
        currency: originCurrency!,
        maximumFractionDigits: 0,
      });
      return {
        value: `Big Mac ~${home}`,
        sub: `~$${dest} · The Economist`,
        hint: `Big Mac index (The Economist): ~$${dest} converted to ${originCurrency}`,
      };
    }
    return { value: `Big Mac ~$${dest}`, sub: undefined, hint: "Big Mac index (The Economist)" };
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
  if (!advisory && !fx && !currencyCode && !visa && !insights && !staticData && !openData)
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

  // Uncurated destinations have no rich open-data record, but the origin-lite
  // layer covers every country — fall back to it for air quality and timezone.
  const destLite = originForCountry(country);
  const air =
    openData?.airQuality ??
    (destLite?.aqi != null
      ? { aqi: destLite.aqi, dominant: null, station: destLite.capital }
      : null);
  const airBand = air ? aqiLabel(air.aqi) : null;
  const hasHealth = Boolean(
    air ||
      (vac &&
        (vac.required.length > 0 ||
          vac.recommended.length > 0 ||
          vac.malaria ||
          vac.healthNotices.length > 0)),
  );
  const hasCost = Boolean(
    insights?.inflation ||
      priceLevel ||
      insights?.lifeExpectancy ||
      openData?.priceLevelEU ||
      openData?.taxWedge,
  );
  const hasPractical = Boolean(
    staticData || nextHolidays.length > 0 || openData,
  );
  const hasSafety = Boolean(advisory && (reasons || impact?.detail || advisory.stateDeptUrl));

  // One combined money tile instead of separate currency and FX tiles.
  // Lead with the destination currency ("1 EUR ≈ 70 PHP") so the rate reads
  // as "what their unit costs in my money"; flip only if that goes below 1
  // (e.g. JPY) to avoid unreadable micro-decimals.
  const currencyValue = advisory?.entryExit.currency ?? currencyCode ?? null;
  const fxValue = fx
    ? 1 / fx.rate >= 1
      ? `1 ${fx.toCode} ≈ ${formatRate(1 / fx.rate)} ${fx.fromCode}`
      : `1 ${fx.fromCode} ≈ ${formatRate(fx.rate)} ${fx.toCode}`
    : null;
  const moneyValue = fxValue ?? currencyValue;

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

  // Apple-keynote-style bento summary: importance = cell size, and cells for
  // missing data simply don't render so the grid adapts per country.
  const cells: BentoCell[] = [];
  if (visaValue) {
    cells.push({
      key: "visa",
      icon: "visa",
      label: "Short-stay visa",
      value: visaValue,
      sub: "Long-term stays need a residence route",
      accent:
        visa?.category === "visa-free" ? "text-emerald-700" : "text-amber-700",
      wide: true,
    });
  } else if (advisory && advisory.entryExit.visaRequired !== null) {
    cells.push({
      key: "visa",
      icon: "visa",
      label: "Visa",
      value: advisory.entryExit.visaRequired ? "Required" : "Not required",
      accent: advisory.entryExit.visaRequired
        ? "text-amber-700"
        : "text-emerald-700",
      wide: true,
    });
  }
  if (moneyValue) {
    cells.push({
      key: "money",
      icon: "money",
      label: "Money",
      value: moneyValue,
      sub: fx
        ? `${currencyValue && currencyValue !== fx.toCode ? `${currencyValue} · ` : ""}Rate as of ${fx.updatedAt}`
        : undefined,
      wide: true,
    });
  }
  if (languageValue)
    cells.push({
      key: "language",
      icon: "language",
      label: "Language",
      value: language ?? languageValue,
      sub:
        language && english && !language.toLowerCase().includes("english")
          ? `English ${english.toLowerCase()}`
          : undefined,
    });
  if (climate && insights)
    cells.push({
      key: "climate",
      icon: "climate",
      label: "Climate",
      value: climate.replace(` in ${insights.climate.city}`, ""),
      sub: insights.climate.city,
    });
  const origin = fromCountry ? originForCountry(fromCountry) : null;
  const sameCountry =
    fromCountry && normalizeName(fromCountry) === normalizeName(country);
  if (air && airBand) {
    const aqiDelta =
      origin?.aqi != null && !sameCountry ? air.aqi - origin.aqi : null;
    cells.push({
      key: "air",
      icon: "air",
      label: "Air quality",
      value: `AQI ${air.aqi}`,
      sub:
        aqiDelta !== null && Math.abs(aqiDelta) >= 5
          ? `${aqiDelta < 0 ? "↓" : "↑"}${Math.abs(aqiDelta)} vs home`
          : airBand.text,
      accent:
        airBand.tone === "good"
          ? "text-emerald-700"
          : airBand.tone === "moderate"
            ? "text-amber-700"
            : "text-orange-700",
      hint: `${airBand.text} · WAQI, station: ${air.station}${origin?.aqi != null ? ` · ${origin.capital} AQI ${origin.aqi}` : ""}`,
    });
  }
  if (priceLevel)
    cells.push({
      key: "prices",
      icon: "prices",
      label: "Prices",
      value: priceLevel.value,
      sub: priceLevel.sub,
      hint: priceLevel.hint,
    });
  else if (openData?.priceLevelEU)
    cells.push({
      key: "prices",
      icon: "prices",
      label: "Prices vs EU",
      value: `${openData.priceLevelEU.value >= 100 ? "+" : "−"}${Math.abs(Math.round(openData.priceLevelEU.value - 100))}%`,
      hint: `Eurostat price level index ${openData.priceLevelEU.year}: EU27 = 100`,
    });
  if (openData?.taxWedge)
    cells.push({
      key: "tax",
      icon: "tax",
      label: "Tax on wages",
      value: `~${Math.round(openData.taxWedge.value)}%`,
      sub: "of labour cost (OECD)",
      hint: "OECD tax wedge: income tax + social contributions, single worker at the average wage, % of total labour cost",
    });
  const destTimezone =
    openData?.timezone ??
    (destLite?.offsetHours != null
      ? {
          name: destLite.capital,
          offset: `UTC${destLite.offsetHours >= 0 ? "+" : "−"}${Math.abs(destLite.offsetHours)}`,
        }
      : null);
  if (destTimezone) {
    const destOffset =
      openData?.timezone != null
        ? parseFloat(openData.timezone.offset.replace("UTC", ""))
        : destLite!.offsetHours!;
    const tzDiff =
      origin?.offsetHours != null && !sameCountry && Number.isFinite(destOffset)
        ? destOffset - origin.offsetHours
        : null;
    const fmtH = (h: number) =>
      `${Number.isInteger(h) ? h : h.toFixed(1)}h`;
    cells.push({
      key: "clock",
      icon: "clock",
      label: "Timezone",
      value:
        tzDiff !== null && tzDiff !== 0
          ? `${tzDiff > 0 ? "+" : "−"}${fmtH(Math.abs(tzDiff))} vs home`
          : tzDiff === 0
            ? "Same time as home"
            : destTimezone.offset,
      sub:
        tzDiff !== null
          ? `${destTimezone.offset} · ${destTimezone.name.split("/").pop()?.replace(/_/g, " ")}`
          : destTimezone.name.split("/").pop()?.replace(/_/g, " "),
      hint: destTimezone.name,
    });
  }

  // Keep the grid gapless: stretch the trailing cells of an incomplete last
  // row of small cells across the remaining columns.
  const visibleCells = cells.slice(0, 8);
  const smallCount = visibleCells.filter((c) => !c.wide).length;
  const rem = smallCount % 4;
  const spanClass = (c: BentoCell, i: number): string => {
    if (c.wide) return "col-span-2";
    const smallIndex = visibleCells.slice(0, i + 1).filter((x) => !x.wide).length;
    const inLastRow = smallIndex > smallCount - rem;
    if (!inLastRow) return "";
    if (rem === 1) return "col-span-2 sm:col-span-4";
    if (rem === 2) return "col-span-2";
    if (rem === 3 && smallIndex === smallCount) return "col-span-2";
    return "";
  };

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

      {visibleCells.length > 0 && (
        <div className="mt-4 grid grid-flow-dense grid-cols-2 gap-2 sm:grid-cols-4">
          {visibleCells.map((c, i) => (
            <div
              key={c.key}
              title={c.hint ?? c.value}
              className={`rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 ${spanClass(c, i)}`}
            >
              <div className="flex items-center gap-1.5">
                <CellIcon name={c.icon} />
                <p className="truncate text-[10px] font-medium uppercase tracking-wider text-stone-400">
                  {c.label}
                </p>
              </div>
              <p
                className={`tnum mt-1.5 truncate text-sm font-semibold ${c.wide ? "sm:text-base" : ""} ${c.accent ?? "text-stone-900"}`}
              >
                {c.value}
              </p>
              {c.sub && (
                <p className="mt-0.5 truncate text-xs text-stone-400">{c.sub}</p>
              )}
            </div>
          ))}
        </div>
      )}

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
              {(staticData || openData) && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {staticData && (
                    <Tile label="Internet" value={`~${staticData.internetMbps} Mbps`} />
                  )}
                  {staticData && (
                    <Tile
                      label="Plugs"
                      value={`Type ${staticData.plugTypes.join("/")} · ${staticData.voltage}`}
                    />
                  )}
                  {openData?.timezone && (
                    <Tile
                      label="Timezone"
                      value={openData.timezone.offset}
                      hint={openData.timezone.name}
                    />
                  )}
                  {openData?.drivingSide && (
                    <Tile
                      label="Driving"
                      value={`${openData.drivingSide === "left" ? "Left" : "Right"}-hand side`}
                    />
                  )}
                  {openData?.callingCode && (
                    <Tile label="Calling code" value={openData.callingCode} />
                  )}
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

          {openTab === "cost" && hasCost && (
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {priceLevel && (
                <Tile label="Price level" value={priceLevel.value} hint={priceLevel.hint} />
              )}
              {openData?.priceLevelEU && (
                <Tile
                  label="Prices vs EU average"
                  value={`${openData.priceLevelEU.value >= 100 ? "+" : "−"}${Math.abs(Math.round(openData.priceLevelEU.value - 100))}%`}
                  hint={`Eurostat price level index ${openData.priceLevelEU.year}: EU27 = 100`}
                />
              )}
              {openData?.taxWedge && (
                <Tile
                  label={`Tax on wages · ${openData.taxWedge.year}`}
                  value={`~${Math.round(openData.taxWedge.value)}% wedge`}
                  hint="OECD tax wedge: income tax + social contributions, single worker at the average wage, % of total labour cost"
                />
              )}
              {insights?.inflation && (
                <Tile
                  label={`Inflation · ${insights.inflation.year}`}
                  value={`${insights.inflation.value.toFixed(1)}% / yr`}
                />
              )}
              {insights?.lifeExpectancy && (
                <Tile
                  label="Life expectancy"
                  value={`${insights.lifeExpectancy.value.toFixed(0)} yrs`}
                />
              )}
            </div>
          )}

          {openTab === "health" && hasHealth && (
            <div className="mt-2.5">
              {air && airBand && (
                <div className="mb-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Tile
                    label={`Air quality · ${openData?.capital ?? air.station}`}
                    value={`AQI ${air.aqi} · ${airBand.text}`}
                    accent={
                      airBand.tone === "good"
                        ? "text-emerald-700"
                        : airBand.tone === "moderate"
                          ? "text-amber-700"
                          : "text-orange-700"
                    }
                    hint={`WAQI, station: ${air.station}`}
                  />
                </div>
              )}
              {vac && (vac.required.length > 0 || vac.recommended.length > 0) && (
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
              {vac?.malaria && (
                <p className="mt-2 text-sm text-stone-600">
                  <span className="font-medium text-stone-800">Malaria:</span>{" "}
                  {vac.malaria.riskLevel} risk
                  {vac.malaria.medications.length > 0
                    ? ` · prophylaxis: ${vac.malaria.medications.join(", ")}`
                    : ""}
                </p>
              )}
              {(vac?.healthNotices ?? []).map((n, i) => (
                <p key={i} className="mt-1.5 text-sm text-amber-800">
                  <span>
                    <span className="font-medium">{n.title}</span>
                    {n.summary ? ` — ${n.summary}` : ""}
                  </span>
                </p>
              ))}
              <p className="mt-2 text-xs text-stone-400">
                Source: {[vac ? "CDC" : null, air ? "WAQI" : null].filter(Boolean).join(" · ")}
              </p>
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
          {openData ? " · Eurostat · OECD" : ""}
          {advisory?.updatedAt ? ` · updated ${advisory.updatedAt}` : ""}
          {fx && fx.updatedAt ? ` · FX ${fx.updatedAt}` : ""}
        </span>
      </div>
    </section>
  );
}
