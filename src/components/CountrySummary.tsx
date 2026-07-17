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
import { taxRegimesForCountry } from "@/lib/taxRegimes";
import { openDataForCountry, aqiLabel } from "@/lib/countryOpenData";
import {
  censorshipForCountry,
  reachabilityLabel,
  allMessengersReachable,
  type MessengerReachability,
} from "@/lib/countryCensorship";
import { salaryForCountry, formatSalary } from "@/lib/countrySalaries";
import {
  cryptoShortStatus,
  cryptoGainsBreakdown,
  cryptoStatusLabel,
  cryptoTaxForCountry,
  cryptoTaxTone,
  CRYPTO_TAX_DATASET_URL,
  formatCryptoRate,
} from "@/lib/cryptoTax";
import { formatMonth, formatDate } from "@/lib/dates";
import MessengerIcons from "@/components/MessengerIcons";
import { useCityContext } from "@/lib/useCityContext";
import ClimateTwinPanel from "@/components/ClimateTwinPanel";
import type { ClimateTwinState } from "@/lib/useClimateTwin";

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
  fromCity?: string;
  toCity?: string;
  visa?: VisaSummary | null;
  climate?: ClimateTwinState;
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
  sub,
}: {
  label: string;
  value: string;
  accent?: string;
  hint?: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2.5"
      title={hint ?? value}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p
        className={`tnum mt-0.5 truncate text-sm font-medium ${accent ?? "text-stone-800"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs leading-snug text-stone-500">{sub}</p>}
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
  | "chat"
  | "people"
  | "salary"
  | "clock"
  | "population"
  | "density"
  | "jobs";

const ICON_PATHS: Record<IconName, string> = {
  visa: "M4 3.5h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Zm2 3.5h4M6 9.5h4M6 12h2.5",
  money: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 2.5v6m1.8-4.6c-.3-.5-1-.9-1.8-.9-1 0-1.8.6-1.8 1.3 0 1.8 3.6.9 3.6 2.6 0 .7-.8 1.3-1.8 1.3-.8 0-1.5-.4-1.8-.9",
  language: "M2.5 4h7M6 2.5V4m2.5 0c-.7 2.6-2.7 4.8-5.5 6m1.2-3.5c.9 1.8 2.6 3.2 4.3 3.9M9.5 13.5 12 7l2.5 6.5m-4.3-2h3.6",
  climate: "M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8m9.4 0h1.8M3.4 3.4l1.3 1.3m6.6 6.6 1.3 1.3m0-9.2-1.3 1.3M4.7 11.3l-1.3 1.3M8 5.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6Z",
  air: "M2 5.5h7a2 2 0 1 0-2-2M2 8.5h10a2 2 0 1 1-2 2M2 11.5h4.5a1.8 1.8 0 1 1-1.8 1.8",
  prices: "M2.8 8.6 8.6 2.8a1 1 0 0 1 .7-.3h3.2a1 1 0 0 1 1 1v3.2a1 1 0 0 1-.3.7l-5.8 5.8a1 1 0 0 1-1.4 0L2.8 10a1 1 0 0 1 0-1.4ZM11 5h.01",
  tax: "M3.5 12.5 12.5 3.5M5 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
  chat: "M2.5 4.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7l-3 2.5V11.5h-.5a2 2 0 0 1-2-2v-5Z",
  people: "M6 4.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-3.5 9a3.5 3.5 0 0 1 7 0M11 5a1.8 1.8 0 1 1 0 3.6m1 4.9a3.2 3.2 0 0 0-2.4-3.1",
  salary: "M2.5 5.5h11a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Zm5.5 1.8a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Z",
  clock: "M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2Zm0 2.5V8l2.5 1.5",
  population: "M2.5 13.5h11M4 13.5V4.2l4-1.7v11m0-7 4 1.5v6M5.6 6h.8M5.6 8.2h.8M5.6 10.4h.8M9.6 8h.8M9.6 10.4h.8",
  density: "M3.5 3.5h.01M8 3.5h.01M12.5 3.5h.01M3.5 8h.01M8 8h.01M12.5 8h.01M3.5 12.5h.01M8 12.5h.01M12.5 12.5h.01",
  jobs: "M3 5.5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Zm3.3 0v-1a1 1 0 0 1 1-1h1.4a1 1 0 0 1 1 1v1M2 9h12",
};

// Compact people count: 3592294 -> "3.6M", 512000 -> "512k", 8400 -> "8,400".
function formatPopulation(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 100_000) return `${Math.round(n / 1000)}k`;
  return n.toLocaleString("en-US");
}

function CellIcon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0 text-stone-500"
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

// Compact reachability signal for the Messengers cell: a check when every app
// is reachable, an alert triangle when OONI saw disruptions.
function MessengerStatusGlyph({ status }: { status: "ok" | "issues" }) {
  const ok = status === "ok";
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={ok ? "All messengers reachable" : "Some messengers restricted"}
      className={`h-4 w-4 shrink-0 ${ok ? "text-stone-600" : "text-amber-600"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{ok ? "All messengers reachable" : "Some messengers restricted"}</title>
      {ok ? (
        <path d="m5 12.5 4.5 4.5L19 7" />
      ) : (
        <>
          <path d="M12 3 2 20h20L12 3Z" />
          <path d="M12 10v4" />
          <path d="M12 17.5v.5" />
        </>
      )}
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
  messengers?: MessengerReachability[];
  messengerStatus?: "ok" | "issues";
}

type TabKey = "practical" | "cost" | "crypto" | "climate" | "health" | "safety";

export default function CountrySummary({
  country,
  profile,
  fromCountry,
  fromCity,
  toCity,
  visa,
  climate: climateState,
}: Props) {
  const [openTab, setOpenTab] = useState<TabKey | null>(null);
  const climateTwin = climateState?.twin ?? null;
  const climateStatus = climateState?.status ?? "empty";
  // City-level overrides: in big countries (India, Australia) capital-level
  // climate/AQI/timezone can be way off, so recompute them for the chosen
  // cities live and fall back to the country snapshot while loading.
  const destCity = useCityContext(toCity, country);
  const originCity = useCityContext(fromCity, fromCountry);
  const advisory: CountryAdvisory | null = advisoryForCountry(country);
  const liveRates = useLiveRates();
  const fx = fromCountry
    ? conversionBetween(fromCountry, country, liveRates)
    : null;
  const currencyCode = currencyForCountry(country);
  const insights = insightsForCountry(country);
  const staticData = staticDataForCountry(country);
  const openData = openDataForCountry(country);
  const cryptoTax = cryptoTaxForCountry(country);
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
  const originOpenData = fromCountry ? openDataForCountry(fromCountry) : null;
  const originCurrency = fromCountry ? currencyForCountry(fromCountry) : null;
  const priceLevel = (() => {
    // Prefer the Eurostat price level index for the home comparison: it is
    // country-specific, whereas the Big Mac index prices the whole euro area
    // as a single number (so Portugal and Germany would read as identical).
    const destPli = openData?.priceLevelEU?.value;
    const originPli = originOpenData?.priceLevelEU?.value;
    if (destPli != null && originPli != null && fromCountry) {
      const pct = Math.round(((destPli - originPli) / originPli) * 100);
      const hint = `Consumer price level: ${Math.round(destPli)} here vs ${Math.round(originPli)} in ${fromCountry} (Eurostat, EU27 = 100)`;
      if (pct === 0) return { value: "Similar prices", sub: undefined, hint };
      return { value: `${pct > 0 ? "+" : ""}${pct}% vs home`, sub: undefined, hint };
    }
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
  if (
    !advisory &&
    !fx &&
    !currencyCode &&
    !visa &&
    !insights &&
    !staticData &&
    !openData &&
    !cryptoTax
  )
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
  const hasHealth = Boolean(
    vac &&
      (vac.required.length > 0 ||
        vac.recommended.length > 0 ||
        vac.malaria ||
        vac.healthNotices.length > 0),
  );
  const regimes = taxRegimesForCountry(country);
  const hasCost = Boolean(
    insights?.inflation ||
      priceLevel ||
      insights?.lifeExpectancy ||
      openData?.priceLevelEU ||
      openData?.taxWedge ||
      regimes.length > 0,
  );
  const hasPractical = Boolean(
    staticData || nextHolidays.length > 0 || openData,
  );
  const hasSafety = Boolean(advisory && (reasons || impact?.detail || advisory.stateDeptUrl));
  const hasClimateTwin = Boolean(climateTwin && climateTwin.verdicts.length > 0);

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
        ? `${currencyValue && currencyValue !== fx.toCode ? `${currencyValue} · ` : ""}Rate as of ${formatDate(fx.updatedAt)}`
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
  if (destCity && destCity.janC !== null && destCity.julC !== null)
    cells.push({
      key: "climate",
      icon: "climate",
      label: "Climate",
      value: `Jan ${destCity.janC}° · Jul ${destCity.julC}°`,
      sub: destCity.city,
      hint: `Mean daily temperature in ${destCity.city}, ${destCity.climateYear} (Open-Meteo)`,
    });
  else if (climate && insights)
    cells.push({
      key: "climate",
      icon: "climate",
      label: "Climate",
      value: climate.replace(` in ${insights.climate.city}`, ""),
      sub: insights.climate.city,
    });
  if (
    climateTwin &&
    climateTwin.dest.sunnyDays != null &&
    climateTwin.home.sunnyDays != null
  ) {
    const diff = climateTwin.dest.sunnyDays - climateTwin.home.sunnyDays;
    cells.push({
      key: "sunny-days",
      icon: "climate",
      label: "Sunny days",
      value: `${climateTwin.dest.sunnyDays} / yr`,
      sub:
        Math.abs(diff) >= 15
          ? `${Math.abs(diff)} ${diff > 0 ? "more" : "fewer"} than home`
          : "About the same as home",
      accent:
        diff >= 15 ? "text-amber-600" : undefined,
      hint: `Days with over 4.5 hours of sunshine in ${climateTwin.dest.label}, ${climateTwin.dest.year} (Open-Meteo), versus ${climateTwin.home.sunnyDays} in ${climateTwin.home.label}`,
    });
  }
  const origin = fromCountry ? originForCountry(fromCountry) : null;
  const sameCountry =
    fromCountry && normalizeName(fromCountry) === normalizeName(country);
  const cityAir =
    destCity?.aqi != null
      ? { aqi: destCity.aqi, station: destCity.station ?? destCity.city }
      : air;
  // Air-quality readings for the Climate twin, each carrying the station it
  // actually came from so a capital-level fallback (e.g. Canberra) is never
  // relabelled as the compared city (e.g. Sydney).
  const originAqiValue = originCity?.aqi ?? origin?.aqi ?? null;
  const homeAqiSide =
    !sameCountry && originAqiValue != null
      ? {
          value: originAqiValue,
          place:
            (originCity?.aqi != null
              ? originCity.station ?? originCity.city
              : origin?.capital) ??
            fromCity ??
            fromCountry ??
            "home",
        }
      : null;
  const destAqiSide =
    cityAir != null
      ? { value: cityAir.aqi, place: cityAir.station ?? toCity ?? name }
      : null;
  const cityAirBand = cityAir ? aqiLabel(cityAir.aqi) : null;
  if (cityAir && cityAirBand) {
    const originAqi = originCity?.aqi ?? origin?.aqi ?? null;
    const aqiDelta =
      originAqi != null && !sameCountry ? cityAir.aqi - originAqi : null;
    cells.push({
      key: "air",
      icon: "air",
      label: "Air quality",
      value: `AQI ${cityAir.aqi}`,
      sub:
        aqiDelta !== null && Math.abs(aqiDelta) >= 5
          ? `${aqiDelta < 0 ? "↓" : "↑"}${Math.abs(aqiDelta)} vs home`
          : cityAirBand.text,
      accent:
        cityAirBand.tone === "good"
          ? "text-emerald-700"
          : cityAirBand.tone === "moderate"
            ? "text-amber-700"
            : "text-orange-700",
      hint: `${cityAirBand.text} · WAQI, station: ${cityAir.station}${originAqi != null ? ` · ${originCity?.city ?? origin?.capital} AQI ${originAqi}` : ""}`,
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
  if (cryptoTax)
    cells.push({
      key: "crypto-tax",
      icon: "tax",
      label: "Crypto taxes",
      value: cryptoShortStatus(cryptoTax),
      accent: cryptoTaxTone(cryptoTax),
      hint: `${cryptoTax.shortSummary} · open the Crypto tab for rates`,
    });
  const censorship = censorshipForCountry(country);
  if (censorship && censorship.messengers.length > 0) {
    const allOk = allMessengersReachable(censorship);
    cells.push({
      key: "messengers",
      icon: "chat",
      label: "Messengers",
      value: "",
      sub: `OONI, 6 months to ${formatMonth(censorship.window.until)}`,
      messengerStatus: allOk ? "ok" : "issues",
      messengers: censorship.messengers,
      hint: censorship.messengers
        .map((m) => `${m.app}: ${reachabilityLabel(m.status).text}`)
        .join(", "),
    });
  }
  const salary = salaryForCountry(country);
  if (salary?.avgAnnual)
    cells.push({
      key: "salary",
      icon: "salary",
      label: "Avg advertised salary",
      value: `${formatSalary(salary.avgAnnual, salary.currency)} / yr`,
      sub: salary.avgMonth ? `Adzuna, ${formatMonth(salary.avgMonth)}` : "Adzuna",
      hint: "Average advertised salary across Adzuna job listings, local currency",
    });
  if (insights?.unemployment)
    cells.push({
      key: "unemployment",
      icon: "jobs",
      label: "Unemployment",
      value: `${insights.unemployment.value.toFixed(1)}%`,
      sub: `Nationwide · World Bank ${insights.unemployment.year}`,
      hint: `National unemployment rate, ${insights.unemployment.value.toFixed(1)}% of the labour force (World Bank, ILO estimate, ${insights.unemployment.year})`,
    });
  // Population: prefer the chosen destination city (Open-Meteo), otherwise the
  // country total (World Bank) so the cell still appears for country-only plans.
  const cityPop =
    destCity?.population != null && destCity.population > 0
      ? destCity.population
      : null;
  const countryPop = insights?.population ?? null;
  if (cityPop != null)
    cells.push({
      key: "population",
      icon: "population",
      label: "City population",
      value: formatPopulation(cityPop),
      sub: `${destCity!.city} · Open-Meteo`,
      hint: `Population of ${destCity!.city} (Open-Meteo geocoding)`,
    });
  else if (countryPop)
    cells.push({
      key: "population",
      icon: "population",
      label: "Population",
      value: formatPopulation(countryPop.value),
      sub: `Nationwide · World Bank ${countryPop.year}`,
      hint: `Total country population (World Bank ${countryPop.year})`,
    });
  if (insights?.density)
    cells.push({
      key: "density",
      icon: "density",
      label: "Density",
      value: `${Math.round(insights.density.value).toLocaleString("en-US")} / km²`,
      sub: `Nationwide · World Bank ${insights.density.year}`,
      hint: `People per square kilometre, country-wide (World Bank ${insights.density.year})`,
    });
  if (insights?.migrantShare)
    cells.push({
      key: "migrants",
      icon: "people",
      label: "Foreign-born",
      value: `${insights.migrantShare.value.toFixed(1)}%`,
      sub: `World Bank ${insights.migrantShare.year}`,
      hint: "International migrants as a share of the population (World Bank)",
    });
  const destTimezone =
    destCity?.offsetHours != null
      ? {
          name: destCity.timezone ?? destCity.city,
          offset: `UTC${destCity.offsetHours >= 0 ? "+" : "−"}${Math.abs(destCity.offsetHours)}`,
        }
      : (openData?.timezone ??
        (destLite?.offsetHours != null
          ? {
              name: destLite.capital,
              offset: `UTC${destLite.offsetHours >= 0 ? "+" : "−"}${Math.abs(destLite.offsetHours)}`,
            }
          : null));
  if (destTimezone) {
    const destOffset =
      destCity?.offsetHours != null
        ? destCity.offsetHours
        : openData?.timezone != null
          ? parseFloat(openData.timezone.offset.replace("UTC", ""))
          : destLite!.offsetHours!;
    const originOffset = originCity?.offsetHours ?? origin?.offsetHours ?? null;
    const tzDiff =
      originOffset != null && !sameCountry && Number.isFinite(destOffset)
        ? destOffset - originOffset
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
  const visibleCells = cells.slice(0, 12);
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
    { key: "crypto", label: "Crypto", show: Boolean(cryptoTax) },
    {
      key: "climate",
      label: "Climate twin",
      // Keep the tab reachable while loading or after a transient failure so
      // the user sees progress / can retry instead of the block vanishing.
      show:
        hasClimateTwin ||
        climateStatus === "loading" ||
        climateStatus === "error",
    },
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
            <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
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
                <p className="truncate text-[10px] font-medium uppercase tracking-wider text-stone-500">
                  {c.label}
                </p>
              </div>
              <p
                className={`tnum mt-1.5 flex items-center gap-1.5 text-sm font-semibold ${c.wide ? "sm:text-base" : ""} ${c.accent ?? "text-stone-900"}`}
              >
                {c.messengerStatus && <MessengerStatusGlyph status={c.messengerStatus} />}
                {c.messengers && <MessengerIcons messengers={c.messengers} />}
                {c.value && <span className="truncate">{c.value}</span>}
              </p>
              {c.sub && (
                <p className="mt-0.5 truncate text-xs text-stone-500">{c.sub}</p>
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
                    <Tile
                      label="Internet"
                      value={`~${staticData.internetMbps} Mbps`}
                      sub="typical home broadband, country median"
                      hint="Median fixed-broadband download speed (Ookla Speedtest Global Index)"
                    />
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
                  <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
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
                  label={`Employment taxes · ${openData.taxWedge.year}`}
                  value={`~${Math.round(openData.taxWedge.value)}%`}
                  sub="of what your job costs goes to tax & social security, not your income-tax rate"
                  hint="OECD tax wedge: income tax + employee and employer social contributions for a single worker at the average wage, as a share of total labour cost"
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
              {regimes.length > 0 && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                    Special tax regimes for newcomers
                  </p>
                  <div className="mt-1.5 space-y-2">
                    {regimes.map((r) => (
                      <div
                        key={r.name}
                        className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
                </div>
              )}
            </div>
          )}

          {openTab === "crypto" && cryptoTax && (
            <div className="mt-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium ${cryptoTaxTone(cryptoTax)}`}
                >
                  {cryptoStatusLabel(cryptoTax)}
                </span>
                <span className="text-xs capitalize text-stone-500">
                  {cryptoTax.legalStatus}
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(() => {
                  const g = cryptoGainsBreakdown(cryptoTax);
                  return (
                    <>
                      <Tile label={g.underLabel} value={g.under} />
                      {g.afterLabel && g.after && (
                        <Tile label={g.afterLabel} value={g.after} />
                      )}
                    </>
                  );
                })()}
                <Tile
                  label="Staking income"
                  value={formatCryptoRate(cryptoTax.stakingRate)}
                />
                <Tile
                  label="Mining income"
                  value={formatCryptoRate(cryptoTax.miningRate)}
                />
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-stone-500">
                General rates, not personal tax advice.{" "}
                <a
                  href={CRYPTO_TAX_DATASET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-700"
                >
                  CryptoNomadHub Global Cryptocurrency Tax Regulations Database
                </a>{" "}
                · CC BY 4.0 · updated {formatDate(cryptoTax.updatedAt)}
              </p>
            </div>
          )}

          {openTab === "climate" && (
            <>
              {hasClimateTwin && climateTwin && (
                <ClimateTwinPanel
                  twin={climateTwin}
                  aqi={{ home: homeAqiSide, dest: destAqiSide }}
                />
              )}
              {!hasClimateTwin && climateStatus === "loading" && (
                <div className="mt-2.5 space-y-2" aria-busy>
                  <div className="h-4 w-40 animate-pulse rounded bg-stone-100" />
                  <div className="h-20 animate-pulse rounded-lg bg-stone-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
                  <p className="text-xs text-stone-500">
                    Loading climate data for {toCity ?? name}…
                  </p>
                </div>
              )}
              {!hasClimateTwin && climateStatus === "error" && (
                <div className="mt-2.5 rounded-lg border border-stone-200 bg-stone-50 p-4 text-center">
                  <p className="text-sm text-stone-600">
                    Couldn&apos;t load climate data right now.
                  </p>
                  <button
                    type="button"
                    onClick={() => climateState?.retry()}
                    className="mt-2 inline-flex items-center rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
                  >
                    Retry
                  </button>
                </div>
              )}
            </>
          )}

          {openTab === "health" && hasHealth && (
            <div className="mt-2.5">
              {vac && vac.required.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                    Vaccines required to enter
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {vac.required.map((v) => (
                      <span
                        key={v.name}
                        className="inline-flex items-center rounded border border-amber-200 bg-white px-2 py-1 text-xs font-medium text-amber-800"
                      >
                        {v.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {vac && vac.recommended.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                    Vaccines CDC suggests having before you go
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {vac.recommended.map((v) => (
                      <span
                        key={v.name}
                        className="inline-flex items-center rounded border border-stone-200 bg-white px-2 py-1 text-xs text-stone-600"
                      >
                        {v.name}
                      </span>
                    ))}
                  </div>
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
              {(vac?.healthNotices ?? []).length > 0 && (
                <div className="mt-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                    Current health notices · tap to read
                  </p>
                  <div className="mt-1.5 space-y-1.5">
                    {vac!.healthNotices.map((n, i) => (
                      <details
                        key={i}
                        className="rounded-md border border-stone-200 bg-white px-3 py-2"
                      >
                        <summary className="cursor-pointer text-sm font-medium text-stone-700 marker:text-stone-300">
                          {n.title}
                        </summary>
                        {n.summary && (
                          <p className="mt-1.5 text-sm text-stone-600">{n.summary}</p>
                        )}
                      </details>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-stone-500">Source: CDC</p>
            </div>
          )}

          {openTab === "safety" && advisory && (
            <div className="mt-2.5 space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium text-stone-800">
                  Level {advisory.level} · {advisory.label}
                </span>
                {advisory.reasons.slice(0, 3).map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center rounded border border-stone-200 bg-white px-2 py-0.5 text-xs text-stone-500"
                  >
                    {humanize(r)}
                  </span>
                ))}
              </div>
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
                    <span className="text-stone-500">({impact.level} risk)</span>{" "}
                    · {impact.detail}
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

      <div className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-500">
        <span>
          {advisory ? "Sources: U.S. State Dept" : "Sources: open data"}
          {visa ? " · Passport Index" : ""}
          {insights ? " · Open-Meteo · World Bank" : ""}
          {openData ? " · Eurostat · OECD" : ""}
          {cryptoTax ? " · CryptoNomadHub" : ""}
          {advisory?.updatedAt ? ` · updated ${formatDate(advisory.updatedAt)}` : ""}
          {fx && fx.updatedAt ? ` · FX ${formatDate(fx.updatedAt)}` : ""}
        </span>
      </div>
    </section>
  );
}
