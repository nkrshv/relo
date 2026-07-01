import {
  advisoryForCountry,
  impactForProfile,
  type CountryAdvisory,
} from "@/lib/countryAdvisory";
import type { Profile } from "@/lib/types";

interface Props {
  country: string;
  profile: Profile;
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

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200/70">
      <span className="font-medium text-slate-400">{label}</span>
      <span className="font-semibold text-slate-700">{value}</span>
    </span>
  );
}

export default function CountrySummary({ country, profile }: Props) {
  const advisory: CountryAdvisory | null = advisoryForCountry(country);
  if (!advisory) return null;

  const style = LEVEL_STYLES[advisory.level] ?? LEVEL_STYLES[1];
  const impact = impactForProfile(advisory, profile);
  const why = advisory.reasons.length
    ? advisory.reasons.slice(0, 3).join(" · ")
    : advisory.label;

  const warnings = [
    ...advisory.doNotTravel.map((d) => `Do not travel: ${d}`),
    ...advisory.restrictions,
    ...(advisory.stateOfEmergency ? ["State of emergency declared"] : []),
    ...(advisory.consularSupport.limited
      ? ["Limited consular / emergency services"]
      : []),
  ].slice(0, 3);

  return (
    <section
      className={`reveal mt-5 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm ring-1 ${style.ring} backdrop-blur`}
      aria-label={`Travel advisory for ${advisory.name}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none" aria-hidden>
            {advisory.flag}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Country snapshot
            </p>
            <h3 className="text-base font-bold text-slate-900">
              {advisory.name}
            </h3>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${style.pill}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          Level {advisory.level} · {advisory.label}
        </span>
      </div>

      {why && (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{why}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {advisory.entryExit.visaRequired !== null && (
          <Chip
            label="Visa"
            value={advisory.entryExit.visaRequired ? "required" : "not required"}
          />
        )}
        {advisory.entryExit.currency && (
          <Chip label="Currency" value={advisory.entryExit.currency} />
        )}
        {advisory.entryExit.language && (
          <Chip label="Language" value={advisory.entryExit.language} />
        )}
      </div>

      {impact.detail && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200/60">
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

      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5">
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

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
        <span>
          Source: U.S. State Department
          {advisory.updatedAt ? ` · updated ${advisory.updatedAt}` : ""}
        </span>
        {advisory.stateDeptUrl && (
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
