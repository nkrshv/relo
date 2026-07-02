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

const LEVEL_STYLES: Record<
  number,
  { dot: string; pill: string; ring: string }
> = {
  1: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    ring: "ring-emerald-100",
  },
  2: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
    ring: "ring-amber-100",
  },
  3: {
    dot: "bg-orange-500",
    pill: "bg-orange-50 text-orange-700 ring-orange-200",
    ring: "ring-orange-100",
  },
  4: {
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-700 ring-red-200",
    ring: "ring-red-100",
  },
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
      return "bg-slate-300";
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
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-200/60">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-0.5 truncate text-sm font-semibold ${accent ?? "text-slate-800"}`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export default function CountrySummary({
  country,
  profile,
  fromCountry,
  visa,
}: Props) {
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

  // Nothing worth showing at all.
  if (!advisory && !fx && !currencyCode && !visa && !insights && !staticData)
    return null;

  const norm = normalizeName(country);
  const name = advisory?.name ?? NAME_BY_NORM[norm] ?? country;
  const flag = advisory?.flag ?? FLAG_BY_NAME[norm] ?? "🌍";
  const currencyValue = advisory?.entryExit.currency ?? currencyCode ?? null;

  const style = advisory
    ? LEVEL_STYLES[advisory.level] ?? LEVEL_STYLES[1]
    : { dot: "", pill: "", ring: "ring-slate-100" };
  const impact = advisory ? impactForProfile(advisory, profile) : null;
  const vac = advisory?.vaccinations ?? null;
  // Reasons may arrive as machine codes (e.g. "civil_unrest").
  const humanize = (r: string) =>
    r.includes("_") || r === r.toLowerCase()
      ? r.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())
      : r;
  const why = advisory
    ? advisory.reasons.length
      ? advisory.reasons.slice(0, 3).map(humanize).join(" · ")
      : advisory.label
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
  const livingRows = insights
    ? [
        insights.inflation ? 1 : 0,
        insights.bigMacUsd ? 1 : 0,
        insights.lifeExpectancy ? 1 : 0,
        nextHolidays.length > 0 ? 1 : 0,
      ].reduce((a, b) => a + b, 0)
    : 0;
  const detailCount =
    livingRows +
    (impact?.detail ? 1 : 0) +
    (vac
      ? vac.required.length +
        vac.recommended.length +
        (vac.malaria ? 1 : 0) +
        vac.healthNotices.length
      : 0) +
    warnings.length;

  return (
    <section
      className={`reveal mt-5 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm ring-1 ${style.ring} backdrop-blur`}
      aria-label={`Country snapshot for ${name}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none" aria-hidden>
            {flag}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Country snapshot
            </p>
            <h3 className="text-base font-bold text-slate-900">{name}</h3>
          </div>
        </div>
        {advisory && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${style.pill}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            Level {advisory.level} · {advisory.label}
          </span>
        )}
      </div>

      {why && (
        <p className="mt-2.5 text-sm leading-relaxed text-slate-500">{why}</p>
      )}

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
        {currencyValue && <Tile label="Currency" value={currencyValue} />}
        {fx && (
          <Tile
            label={`FX · 1 ${fx.fromCode}`}
            value={`≈ ${formatRate(fx.rate)} ${fx.toCode}`}
            accent="text-indigo-700"
          />
        )}
        {advisory?.entryExit.language && (
          <Tile label="Language" value={advisory.entryExit.language} />
        )}
        {climate && insights && (
          <Tile label={`Climate · ${insights.climate.city}`} value={climate} />
        )}
        {staticData && (
          <Tile
            label="Internet"
            value={`~${staticData.internetMbps} Mbps`}
            accent="text-sky-700"
          />
        )}
        {staticData && (
          <Tile
            label="Plugs"
            value={`Type ${staticData.plugTypes.join("/")} · ${staticData.voltage}`}
          />
        )}
        {staticData && (
          <Tile
            label="English level"
            value={
              staticData.english.charAt(0).toUpperCase() +
              staticData.english.slice(1)
            }
          />
        )}
      </div>

      {(impact?.detail || hasHealth || warnings.length > 0 || livingRows > 0) && (
        <details className="group/details mt-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800 [&::-webkit-details-marker]:hidden">
            <span
              className="inline-block transition-transform duration-200 group-open/details:rotate-90"
              aria-hidden
            >
              ▸
            </span>
            Country details
            {detailCount > 0 && (
              <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 ring-1 ring-indigo-100">
                {detailCount}
              </span>
            )}
          </summary>

          <div className="mt-2 space-y-2.5">
            {livingRows > 0 && insights && (
              <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Cost &amp; living
                </p>
                {insights.inflation && (
                  <p className="mt-1.5 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Inflation:
                    </span>{" "}
                    {insights.inflation.value}% ({insights.inflation.year},
                    World Bank)
                  </p>
                )}
                {insights.bigMacUsd && (
                  <p className="mt-1.5 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Big Mac price:
                    </span>{" "}
                    ~${insights.bigMacUsd.value} (The Economist)
                  </p>
                )}
                {insights.lifeExpectancy && (
                  <p className="mt-1.5 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Life expectancy:
                    </span>{" "}
                    {insights.lifeExpectancy.value} years (WHO)
                  </p>
                )}
                {nextHolidays.length > 0 && insights.holidays && (
                  <p className="mt-1.5 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Next public holidays:
                    </span>{" "}
                    {nextHolidays
                      .map((h) => `${h.name} (${h.date})`)
                      .join(", ")}{" "}
                    · offices closed
                  </p>
                )}
              </div>
            )}
            {impact?.detail && (
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200/60">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${impactDot(impact.level)}`}
                  aria-hidden
                />
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">
                    For {PROFILE_LABEL[profile]}
                  </span>{" "}
                  <span className="text-slate-400">({impact.level} risk)</span>{" "}
                  — {impact.detail}
                </p>
              </div>
            )}

            {hasHealth && vac && (
              <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Health · CDC
                </p>
                {vac.required.length > 0 && (
                  <p className="mt-1.5 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Required vaccines:
                    </span>{" "}
                    {vac.required.map((v) => v.name).join(", ")}
                  </p>
                )}
                {vac.recommended.length > 0 && (
                  <p className="mt-1.5 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Recommended vaccines:
                    </span>{" "}
                    {vac.recommended.map((v) => v.name).join(", ")}
                  </p>
                )}
                {vac.malaria && (
                  <p className="mt-1.5 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Malaria:
                    </span>{" "}
                    {vac.malaria.riskLevel} risk
                    {vac.malaria.medications.length > 0
                      ? ` · prophylaxis: ${vac.malaria.medications.join(", ")}`
                      : ""}
                  </p>
                )}
                {vac.healthNotices.map((n, i) => (
                  <p
                    key={i}
                    className="mt-1.5 flex items-start gap-1.5 text-sm text-amber-800"
                  >
                    <span className="mt-0.5 shrink-0" aria-hidden>
                      ⚠️
                    </span>
                    <span>
                      <span className="font-semibold">{n.title}</span>
                      {n.summary ? ` — ${n.summary}` : ""}
                    </span>
                  </p>
                ))}
              </div>
            )}

            {warnings.length > 0 && (
              <ul className="space-y-1.5 rounded-xl bg-amber-50/60 p-3 ring-1 ring-amber-100">
                {warnings.map((w, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-amber-800"
                  >
                    <span className="mt-0.5 shrink-0" aria-hidden>
                      ⚠️
                    </span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
        <span>
          {advisory
            ? "Sources: U.S. State Dept"
            : "Sources: open data"}
          {visa ? " · Passport Index" : ""}
          {insights ? " · Open-Meteo · World Bank" : ""}
          {advisory?.updatedAt ? ` · updated ${advisory.updatedAt}` : ""}
          {fx && fx.updatedAt ? ` · FX ${fx.updatedAt}` : ""}
        </span>
        {advisory?.stateDeptUrl && (
          <a
            href={advisory.stateDeptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 transition hover:text-indigo-800"
          >
            Full advisory
          </a>
        )}
      </div>
    </section>
  );
}
