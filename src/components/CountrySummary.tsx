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

const LEVEL_STYLES: Record<number, { dot: string; pill: string }> = {
  1: { dot: "bg-emerald-500", pill: "text-emerald-700" },
  2: { dot: "bg-amber-500", pill: "text-amber-700" },
  3: { dot: "bg-orange-600", pill: "text-orange-700" },
  4: { dot: "bg-red-600", pill: "text-red-700" },
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
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
        {label}
      </p>
      <p
        className={`tnum mt-0.5 truncate text-sm font-medium ${accent ?? "text-stone-800"}`}
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
  const currencyValue = advisory?.entryExit.currency ?? currencyCode ?? null;

  const style = advisory
    ? LEVEL_STYLES[advisory.level] ?? LEVEL_STYLES[1]
    : { dot: "", pill: "" };
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
        {advisory && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium ${style.pill}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            Level {advisory.level} · {advisory.label}
          </span>
        )}
      </div>

      {why && (
        <p className="mt-2.5 text-sm leading-relaxed text-stone-500">{why}</p>
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
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 py-1 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900 [&::-webkit-details-marker]:hidden">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3 text-stone-400 transition-transform duration-150 group-open/details:rotate-90"
              aria-hidden
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
            Country details
            {detailCount > 0 && (
              <span className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
                {detailCount}
              </span>
            )}
          </summary>

          <div className="mt-2 space-y-2.5">
            {livingRows > 0 && insights && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                  Cost &amp; living
                </p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {insights.inflation && (
                    <Tile
                      label={`Inflation · ${insights.inflation.year}`}
                      value={`${insights.inflation.value.toFixed(1)}% / yr`}
                    />
                  )}
                  {priceLevel && (
                    <div
                      className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2.5"
                      title={priceLevel.hint}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                        Price level
                      </p>
                      <p className="mt-0.5 truncate text-sm font-medium text-stone-800">
                        {priceLevel.value}
                      </p>
                    </div>
                  )}
                  {insights.lifeExpectancy && (
                    <Tile
                      label="Life expectancy"
                      value={`${insights.lifeExpectancy.value.toFixed(0)} yrs`}
                    />
                  )}
                </div>
                {nextHolidays.length > 0 && (
                  <div className="mt-2">
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

            {hasHealth && vac && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                  Health · CDC
                </p>
                {(vac.required.length > 0 || vac.recommended.length > 0) && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
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
                    <span className="font-medium text-stone-800">
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
                    className="mt-1.5 text-sm text-amber-800"
                  >
                    <span>
                      <span className="font-medium">{n.title}</span>
                      {n.summary ? ` — ${n.summary}` : ""}
                    </span>
                  </p>
                ))}
              </div>
            )}

            {warnings.length > 0 && (
              <ul className="space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-3">
                {warnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-800">
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-400">
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
            className="font-medium text-stone-500 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
          >
            Full advisory
          </a>
        )}
      </div>
    </section>
  );
}
