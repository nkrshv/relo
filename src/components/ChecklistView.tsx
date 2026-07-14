"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  ChecklistItem,
  Profile,
  ReloInput,
  ReloPlan,
  VisaSummary,
} from "@/lib/types";
import CountrySummary from "@/components/CountrySummary";
import { track } from "@/lib/analytics";
import { useClimateTwin } from "@/lib/useClimateTwin";
import { ALL_COUNTRIES } from "@/lib/allCountries";
import { normalizeName } from "@/lib/countryFacts";
import { openDataForCountry } from "@/lib/countryOpenData";

const FLAG_BY_NORM: Record<string, string> = Object.fromEntries(
  ALL_COUNTRIES.map((c) => [normalizeName(c.name), c.emoji]),
);

// Short-stay entry rules (Passport Index) cover tourist visits only.
// The tail of the verdict spells out what the reader's actual purpose
// needs, so a digital nomad doesn't mistake "90 days visa-free" for a
// right to live and work there.
function stayTail(profile: Profile): string {
  switch (profile) {
    case "nomad":
      return " But that's tourist entry: working remotely from there usually needs its own permit, like a digital nomad visa. The plan below starts with it.";
    case "student":
      return " But that's tourist entry: studying there takes a student visa or permit, and the plan below starts with it.";
    case "family":
      return " Moving your family for good is a different story: everyone needs a residence route, and this plan walks you through it.";
    default:
      return " Moving for good is a different story: that takes a residence permit, and this plan walks you through it.";
  }
}

// Same idea for visa-required destinations: make sure the reader applies
// for the visa that matches their purpose, not just any tourist visa.
function requiredTail(profile: Profile): string {
  switch (profile) {
    case "nomad":
      return " And pick the right one: a tourist visa won't cover working remotely, so look at a digital nomad or work visa. It's step one below.";
    case "student":
      return " And make it the right one: studying takes a student visa, not a tourist one. It's step one below.";
    case "family":
      return " And everyone moving with you needs their own. It's step one below.";
    default:
      return " It's step one below.";
  }
}

// The first question every mover has, answered in one plain-language line
// right under the route: do I need a visa on my passport?
function VisaAnswer({
  visa,
  fromCountry,
  profile,
}: {
  visa: VisaSummary;
  fromCountry: string;
  profile: Profile;
}) {
  const passport = `${fromCountry} passport`;
  const tail = stayTail(profile);
  let verdict: ReactNode;
  switch (visa.category) {
    case "visa-free":
      verdict = (
        <>
          Good news: your {passport}{" "}
          <strong className="font-semibold text-emerald-700">
            gets you in visa-free
          </strong>
          {visa.days ? `, up to ${visa.days} days, zero paperwork` : ", zero paperwork"}
          .{tail}
        </>
      );
      break;
    case "visa-on-arrival":
      verdict = (
        <>
          Easy one: with a {passport} you{" "}
          <strong className="font-semibold text-emerald-700">
            get a visa right at the border
          </strong>
          , no paperwork before the flight.{tail}
        </>
      );
      break;
    case "e-visa":
      verdict = (
        <>
          One thing before you fly: your {passport}{" "}
          <strong className="font-semibold text-amber-700">
            needs an e-Visa
          </strong>
          : a few minutes online, done.{tail}
        </>
      );
      break;
    case "eta":
      verdict = (
        <>
          One thing before you fly: grab a{" "}
          <strong className="font-semibold text-amber-700">
            travel authorization (eTA)
          </strong>{" "}
          online, a few minutes on a {passport}.{tail}
        </>
      );
      break;
    case "no-admission":
      verdict = (
        <>
          Hard stop: right now{" "}
          <strong className="font-semibold text-red-700">
            a {passport} won&apos;t get you in
          </strong>
          . Check official sources before making any plans.
        </>
      );
      break;
    default:
      verdict = (
        <>
          Heads up: your {passport}{" "}
          <strong className="font-semibold text-amber-700">
            needs a visa, even for a quick trip
          </strong>
          . Get that sorted before you book anything.{requiredTail(profile)}
        </>
      );
  }
  return <p className="mt-3 text-base leading-relaxed text-stone-700">{verdict}</p>;
}

// Tasks about registering with local authorities get a map link per real
// office name (from OpenStreetMap) near the capital.
const OFFICE_TASK_RE =
  /\bregist(er|ration)|town hall|city hall|municipal|rathaus|ayuntamiento|câmara municipal|gemeente|commune|anmeld/i;

// Departure tasks (deregistering, cancelling home contracts, "abmeldung" in
// Germany, "uitschrijven" in the Netherlands) are about the origin country,
// so their office links must point home, not at the destination city.
const DEREGISTER_RE = /\bde-?regist|abmeld|uitschrijv|unregister|deregistration/i;

function officeTaskMatch(item: ChecklistItem): boolean {
  return OFFICE_TASK_RE.test(
    `${item.title} ${item.why} ${(item.steps ?? []).join(" ")}`,
  );
}

function isDepartureOfficeTask(
  item: ChecklistItem,
  fromCountry: string | undefined,
): boolean {
  const text = `${item.title} ${item.why} ${(item.steps ?? []).join(" ")}`;
  if (DEREGISTER_RE.test(text)) return true;
  // A task that names the origin country (e.g. "Deregister from the
  // Netherlands") is a home-side task even without a deregister keyword.
  return Boolean(fromCountry && new RegExp(`\\b${escapeRegExp(fromCountry)}\\b`, "i").test(text));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function OfficeLinks({
  offices,
  capital,
  curated,
}: {
  offices: { name: string; place: string }[];
  capital: string;
  curated: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        Offices near {capital} · tap to open the map
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {offices.slice(0, 4).map(({ name, place }) => (
          <a
            key={name}
            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${name}, ${place}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3 shrink-0 text-stone-400"
              aria-hidden
            >
              <path d="M8 14.5s-4.5-4.1-4.5-7.5a4.5 4.5 0 0 1 9 0c0 3.4-4.5 7.5-4.5 7.5Zm0-5.8a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z" />
            </svg>
            {name}
          </a>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-stone-400">
        {curated
          ? "OpenStreetMap · moving to another city? Search its local office instead."
          : "OpenStreetMap · exact office names vary; the map search finds the local one."}
      </p>
    </div>
  );
}

interface Props {
  input: ReloInput;
  plan: ReloPlan;
  visa?: VisaSummary | null;
  unlocked: boolean;
  unlocking: boolean;
  onUnlock: () => void;
  onReset: () => void;
}

const CHECK_KEY_PREFIX = "relochecklist:checked";
const VIEW_KEY = "relochecklist:view";

type ViewMode = "simple" | "advanced";

function itemId(phaseIndex: number, itemIndex: number): string {
  return `${phaseIndex}:${itemIndex}`;
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function prettyHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "official site";
  }
}

function planStorageKey(input: ReloInput, plan: ReloPlan): string {
  const signature = [
    input.fromCountry,
    input.toCountry,
    input.profile,
    plan.destinationSummary,
    ...plan.phases.flatMap((p) => p.items.map((it) => it.title)),
  ].join("|");
  return `${CHECK_KEY_PREFIX}:${hashString(signature)}`;
}

// A small coloured dot is the only per-category colour signal.
const CATEGORY_DOTS: Record<string, string> = {
  residency: "bg-indigo-500",
  visa: "bg-indigo-500",
  healthcare: "bg-rose-500",
  health: "bg-rose-500",
  banking: "bg-emerald-500",
  finance: "bg-emerald-500",
  housing: "bg-amber-500",
  taxes: "bg-violet-500",
  tax: "bg-violet-500",
  logistics: "bg-sky-500",
  packing: "bg-teal-500",
};

function categoryDot(category: string) {
  return CATEGORY_DOTS[category.trim().toLowerCase()] ?? "bg-stone-400";
}

function milestoneCopy(pct: number): string {
  if (pct === 0) return "Ready when you are. Start with the first step.";
  if (pct < 25) return "Great start. Momentum matters more than speed.";
  if (pct < 50) return "Solid progress. The hardest steps are behind you soon.";
  if (pct < 75) return "Over halfway there. Keep it rolling.";
  if (pct < 100) return "Almost done, just a few steps left.";
  return "Everything checked off. Enjoy your new home.";
}

interface TaskRow {
  pos: string;
  display: string;
  item: ChecklistItem;
  phaseIndex: number;
}

function buildRows(plan: ReloPlan): {
  rows: TaskRow[];
  byModelId: Map<string, TaskRow>;
} {
  const rows: TaskRow[] = [];
  let n = 0;
  plan.phases.forEach((phase, pi) => {
    phase.items.forEach((item, ii) => {
      n += 1;
      rows.push({
        pos: itemId(pi, ii),
        display: `REL-${n}`,
        item,
        phaseIndex: pi,
      });
    });
  });
  const byModelId = new Map<string, TaskRow>();
  for (const r of rows) {
    if (r.item.id) byModelId.set(r.item.id, r);
  }
  return { rows, byModelId };
}

// Rounded-square checkbox in the Linear/Notion vein.
function CheckToggle({
  id,
  checked,
  onToggle,
  disabled,
  disabledReason,
}: {
  id: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <button
      id={id}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      onClick={onToggle}
      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors ${
        disabled
          ? "cursor-not-allowed border-stone-200 bg-stone-100"
          : checked
            ? "cursor-pointer border-stone-900 bg-stone-900"
            : "cursor-pointer border-stone-300 bg-white hover:border-stone-400"
      }`}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-3 w-3 text-white transition-opacity duration-150 ${
          checked ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      >
        <path d="M4 10.5l4 4 8-8.5" />
      </svg>
    </button>
  );
}

// Linear-style tracker: flat task table with IDs, deadlines and dependencies.
function AdvancedTable({
  plan,
  checked,
  toggle,
  unlocked,
}: {
  plan: ReloPlan;
  checked: Record<string, boolean>;
  toggle: (id: string) => void;
  unlocked: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { rows, byModelId } = buildRows(plan);
  const hasDeps = rows.some((r) => r.item.dependsOn?.length);

  return (
    <div className="space-y-6">
      {plan.phases.map((phase, pi) => {
        const locked = !unlocked && pi > 0;
        const phaseRows = rows.filter((r) => r.phaseIndex === pi);
        const phaseDone = phaseRows.filter((r) => checked[r.pos]).length;
        return (
          <section key={phase.key} className={locked ? "print:hidden" : ""}>
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="text-sm font-semibold text-stone-900">
                {phase.title}
              </h2>
              <span className="text-xs tabular-nums text-stone-400">
                {locked ? "Locked" : `${phaseDone}/${phaseRows.length}`}
              </span>
            </div>
            <div className="relative">
              <div
                className={`divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white ${
                  locked ? "pointer-events-none select-none blur-sm" : ""
                }`}
                aria-hidden={locked}
              >
                {phaseRows.map((row) => {
                  const isChecked = !!checked[row.pos];
                  const deps = (row.item.dependsOn ?? [])
                    .map((d) => byModelId.get(d))
                    .filter((d): d is TaskRow => !!d && d.pos !== row.pos);
                  const openBlockers = deps.filter((d) => !checked[d.pos]);
                  const isBlocked = !isChecked && openBlockers.length > 0;
                  const isOpen = !!expanded[row.pos];
                  const hasDetails = !!(
                    row.item.why ||
                    row.item.steps?.length ||
                    row.item.documents?.length ||
                    row.item.commonMistake ||
                    row.item.tip ||
                    row.item.url
                  );
                  return (
                    <div key={row.pos}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                          isChecked ? "bg-stone-50/60" : "hover:bg-stone-50"
                        }`}
                      >
                        <CheckToggle
                          id={`adv-${row.pos}`}
                          checked={isChecked}
                          onToggle={() => toggle(row.pos)}
                          disabled={isBlocked}
                          disabledReason={`Complete ${openBlockers
                            .map((d) => d.display)
                            .join(", ")} first`}
                        />
                        <span className="w-12 shrink-0 font-mono text-[11px] text-stone-400">
                          {row.display}
                        </span>
                        <button
                          onClick={() =>
                            hasDetails &&
                            setExpanded((p) => ({
                              ...p,
                              [row.pos]: !p[row.pos],
                            }))
                          }
                          className={`flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm ${
                            hasDetails ? "cursor-pointer" : "cursor-default"
                          }`}
                        >
                          <span
                            className={`truncate font-medium ${
                              isChecked
                                ? "text-stone-400 line-through"
                                : isBlocked
                                  ? "text-stone-500"
                                  : "text-stone-900"
                            }`}
                          >
                            {row.item.title}
                          </span>
                          {hasDetails && (
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`h-3 w-3 shrink-0 text-stone-300 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                              aria-hidden
                            >
                              <path d="M4 6l4 4 4-4" />
                            </svg>
                          )}
                        </button>
                        <span className="hidden shrink-0 items-center gap-1.5 text-[11px] font-medium capitalize text-stone-500 sm:inline-flex">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${categoryDot(row.item.category)}`}
                            aria-hidden
                          />
                          {row.item.category}
                        </span>
                        {!isChecked && row.item.deadline && (
                          <span className="hidden shrink-0 text-[11px] font-medium text-amber-700 md:inline">
                            {row.item.deadline}
                          </span>
                        )}
                        {isBlocked && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            Blocked by{" "}
                            {openBlockers.map((d) => d.display).join(", ")}
                          </span>
                        )}
                        {!isBlocked && deps.length > 0 && !isChecked && (
                          <span className="hidden shrink-0 font-mono text-[10px] text-stone-300 sm:inline">
                            ← {deps.map((d) => d.display).join(", ")}
                          </span>
                        )}
                      </div>
                      {isOpen && hasDetails && (
                        <div className="space-y-2.5 border-t border-stone-100 bg-stone-50/60 px-3 py-3 pl-[102px] text-sm leading-relaxed text-stone-600">
                          {row.item.why && <p>{row.item.why}</p>}
                          {deps.length > 0 && (
                            <p className="text-xs text-stone-500">
                              <span className="font-medium">Depends on:</span>{" "}
                              {deps
                                .map((d) => `${d.display} ${d.item.title}`)
                                .join(" · ")}
                            </p>
                          )}
                          {row.item.steps && row.item.steps.length > 0 && (
                            <ol className="space-y-1.5">
                              {row.item.steps.map((step, si) => (
                                <li key={si} className="flex items-baseline gap-2">
                                  <span className="w-4 shrink-0 text-right text-xs font-medium tabular-nums text-stone-400">
                                    {si + 1}.
                                  </span>
                                  <span className="min-w-0">{step}</span>
                                </li>
                              ))}
                            </ol>
                          )}
                          {row.item.documents &&
                            row.item.documents.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {row.item.documents.map((doc, di) => (
                                  <span
                                    key={di}
                                    className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs text-stone-600"
                                  >
                                    {doc}
                                  </span>
                                ))}
                              </div>
                            )}
                          {row.item.commonMistake && (
                            <p className="text-xs leading-relaxed">
                              <span className="font-medium text-rose-700">
                                Common mistake:
                              </span>{" "}
                              {row.item.commonMistake}
                            </p>
                          )}
                          {row.item.tip && <p>{row.item.tip}</p>}
                          {row.item.url && (
                            <a
                              href={row.item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
                            >
                              {prettyHost(row.item.url)}
                            </a>
                          )}
                          {row.item.affiliate && (
                            <a
                              href={row.item.affiliate.url}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
                            >
                              {row.item.affiliate.label}
                              <span className="font-normal text-stone-400">
                                · partner
                              </span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {locked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="pointer-events-auto rounded-lg border border-stone-200 bg-white p-4 text-center shadow-sm">
                    <p className="text-sm font-medium text-stone-700">
                      Unlock the full plan to see this phase
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}
      {!hasDeps && (
        <p className="text-xs text-stone-400">
          Dependencies appear here for newly generated plans.
        </p>
      )}
    </div>
  );
}

export default function ChecklistView({
  input,
  plan,
  visa,
  unlocked,
  unlocking,
  onUnlock,
  onReset,
}: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<ViewMode>("simple");
  const climate = useClimateTwin(
    input.fromCountry,
    input.toCountry,
    input.fromCity,
    input.toCity,
  );
  const climateTwin = climate.twin;
  // Fire once when the visitor is exposed to locked phases behind the paywall.
  const paywallTracked = useRef(false);
  useEffect(() => {
    if (!unlocked && plan.phases.length > 1 && !paywallTracked.current) {
      paywallTracked.current = true;
      track("Paywall Viewed");
    }
  }, [unlocked, plan.phases.length]);
  // Climate-derived packing advice is woven into the checklist as ordinary
  // tasks at the end of "Before you go" (always the free, first phase), so it
  // is not a detached block. Their checked state lives under the same
  // positional keys as every other task.
  const augmentedPlan = useMemo<ReloPlan>(() => {
    const packing = climateTwin?.packing ?? [];
    if (packing.length === 0) return plan;
    const phases = plan.phases.map((p) => ({ ...p, items: [...p.items] }));
    const target = phases.find((p) => p.key === "before") ?? phases[0];
    if (target) {
      packing.forEach((line, i) => {
        target.items.push({
          id: `pack-${i}`,
          title: line,
          why: "",
          category: "Packing",
        });
      });
    }
    return { ...plan, phases };
  }, [plan, climateTwin]);
  // Office map links are built for both ends of the move: destination offices
  // for arrival tasks (registration), and home-country offices for departure
  // tasks (deregistration), so a "Deregister from the Netherlands" task never
  // points at the destination city's town hall.
  const officeSet = (
    country: string | undefined,
    cityRaw: string | undefined,
  ) => {
    if (!country) return null;
    const data = openDataForCountry(country);
    const city = cityRaw?.trim();
    const cityIsCapital =
      city &&
      data?.capital &&
      normalizeName(city) === normalizeName(data.capital);
    if (city && !cityIsCapital)
      return {
        offices: [
          { name: `Town hall / city hall, ${city}`, place: city },
          { name: `Immigration office, ${city}`, place: city },
        ],
        capital: city,
        curated: false,
      };
    if (data?.offices && data.offices.length > 0)
      return {
        offices: data.offices.map((name) => ({ name, place: data.capital })),
        capital: data.capital,
        curated: true,
      };
    return null;
  };
  const destOffices = officeSet(input.toCountry, input.toCity);
  const originOffices = officeSet(input.fromCountry, input.fromCity);
  const storageKey = planStorageKey(input, plan);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "advanced" || saved === "simple") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setView(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  function switchView(mode: ViewMode) {
    setView(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecked(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});
    } catch {
       
      setChecked({});
    }
  }, [storageKey]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const totalItems = augmentedPlan.phases.reduce(
    (n, p) => n + p.items.length,
    0,
  );
  const doneItems = augmentedPlan.phases.reduce(
    (n, p, pi) =>
      n + p.items.filter((_, ii) => checked[itemId(pi, ii)]).length,
    0,
  );
  const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
  const allDone = totalItems > 0 && doneItems >= totalItems;

  useEffect(() => {
    if (allDone) {
      doneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [allDone]);

  // First unchecked step in an unlocked phase gets the "Up next" spotlight.
  let nextId: string | null = null;
  outer: for (let pi = 0; pi < augmentedPlan.phases.length; pi++) {
    if (!unlocked && pi > 0) break;
    for (let ii = 0; ii < augmentedPlan.phases[pi].items.length; ii++) {
      if (!checked[itemId(pi, ii)]) {
        nextId = itemId(pi, ii);
        break outer;
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl reveal">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={onReset}
          className="text-sm text-stone-500 transition-colors hover:text-stone-900"
        >
          ← Start over
        </button>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-stone-200 bg-white p-0.5">
            {(
              [
                ["simple", "Simple"],
                ["advanced", "Advanced"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => switchView(mode)}
                aria-pressed={view === mode}
                className={`rounded px-2.5 py-1 text-sm transition-colors ${
                  view === mode
                    ? "bg-stone-100 font-medium text-stone-900"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
          >
            Print / PDF
          </button>
        </div>
      </div>

      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
          Your relocation plan
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          {FLAG_BY_NORM[normalizeName(input.fromCountry)] && (
            <span className="mr-2" aria-hidden>
              {FLAG_BY_NORM[normalizeName(input.fromCountry)]}
            </span>
          )}
          {input.fromCity?.trim() || input.fromCountry}
          <span className="mx-2.5 font-normal text-stone-300" aria-hidden>
            →
          </span>
          {FLAG_BY_NORM[normalizeName(input.toCountry)] && (
            <span className="mr-2" aria-hidden>
              {FLAG_BY_NORM[normalizeName(input.toCountry)]}
            </span>
          )}
          {input.toCity?.trim() || input.toCountry}
        </h1>
        {visa && (
          <VisaAnswer
            visa={visa}
            fromCountry={visa.passport ?? input.fromCountry}
            profile={input.profile}
          />
        )}
        {plan.destinationSummary && (
          <p className="mt-3 text-stone-600">{plan.destinationSummary}</p>
        )}
        {plan.feasibility && (
          <div
            role="alert"
            className={`reveal mt-5 flex items-start gap-3 rounded-lg border p-4 ${
              plan.feasibility.level === "blocked"
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                plan.feasibility.level === "blocked"
                  ? "text-red-500"
                  : "text-amber-500"
              }`}
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625l6.28-10.875ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
            <div className="min-w-0">
              <p
                className={`text-sm font-semibold ${
                  plan.feasibility.level === "blocked"
                    ? "text-red-800"
                    : "text-amber-800"
                }`}
              >
                {plan.feasibility.level === "blocked"
                  ? "This move may not be possible right now"
                  : "Important restrictions to check first"}
              </p>
              {plan.feasibility.note && (
                <p
                  className={`mt-1 text-sm ${
                    plan.feasibility.level === "blocked"
                      ? "text-red-700"
                      : "text-amber-700"
                  }`}
                >
                  {plan.feasibility.note}
                </p>
              )}
            </div>
          </div>
        )}
        <CountrySummary
          country={input.toCountry}
          profile={input.profile}
          fromCountry={input.fromCountry}
          fromCity={input.fromCity}
          toCity={input.toCity}
          visa={visa ?? null}
          climate={climate}
        />
      </header>

      {/* Progress rail: sticks to the top while working through the list. */}
      <div className="sticky top-3 z-20 mb-8 print:hidden">
        <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <div className="relative h-10 w-10 shrink-0">
            <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90" aria-hidden>
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                strokeWidth="4"
                className="stroke-stone-100"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 16}
                strokeDashoffset={2 * Math.PI * 16 * (1 - pct / 100)}
                className={`transition-[stroke-dashoffset] duration-500 ease-out ${
                  allDone ? "stroke-emerald-500" : "stroke-stone-900"
                }`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums text-stone-700">
              {pct}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-stone-800">
                {doneItems}/{totalItems} steps done
              </p>
              <p className="hidden text-xs text-stone-400 sm:block">
                {input.fromCountry} → {input.toCountry}
              </p>
            </div>
            <p className="mt-0.5 truncate text-xs text-stone-500">
              {milestoneCopy(pct)}
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                  allDone ? "bg-emerald-500" : "bg-stone-900"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {allDone && (
        <div
          ref={doneRef}
          className="reveal relative mb-8 flex flex-col items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.3 3.29 6.8-6.8a1 1 0 0 1 1.4 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-emerald-900">
                Plan complete
              </p>
              <p className="mt-0.5 text-sm text-emerald-700">
                All {totalItems} steps checked off. Save a copy for your
                records or start a plan for another move.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
            >
              Print / PDF
            </button>
            <button
              onClick={onReset}
              className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              New plan
            </button>
          </div>
        </div>
      )}

      {view === "advanced" && (
        <AdvancedTable
          plan={augmentedPlan}
          checked={checked}
          toggle={toggle}
          unlocked={unlocked}
        />
      )}

      {/* Journey timeline: a vertical rail connects the phases of the move. */}
      <div
        className={`relative space-y-10 pl-10 sm:pl-12 ${view === "advanced" ? "hidden" : ""}`}
      >
        <div
          className="absolute bottom-4 left-[15px] top-1 w-px bg-stone-200 sm:left-[19px] print:hidden"
          aria-hidden
        >
          <div className="timeline-ink absolute inset-0 bg-stone-900" />
        </div>
        {augmentedPlan.phases.map((phase, pi) => {
          const locked = !unlocked && pi > 0;
          const phaseDone = phase.items.filter((_, ii) => checked[itemId(pi, ii)]).length;
          const phaseComplete = phase.items.length > 0 && phaseDone >= phase.items.length;
          return (
            <section key={phase.key} className={locked ? "print:hidden" : ""}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight text-stone-900">
                <span
                  className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ring-4 ring-[#fbfbfa] transition-colors duration-300 sm:h-10 sm:w-10 ${
                    phaseComplete
                      ? "bg-emerald-600 text-white"
                      : locked
                        ? "border border-stone-200 bg-white text-stone-300"
                        : "border border-stone-300 bg-white text-stone-600"
                  }`}
                >
                  {phaseComplete ? (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.3 3.29 6.8-6.8a1 1 0 0 1 1.4 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    pi + 1
                  )}
                </span>
                {phase.title}
                {locked ? (
                  <span className="ml-1 text-xs font-medium text-stone-400">
                    Locked
                  </span>
                ) : (
                  <span
                    className={`ml-1 text-xs font-medium tabular-nums print:hidden ${
                      phaseComplete ? "text-emerald-600" : "text-stone-400"
                    }`}
                  >
                    {phaseDone}/{phase.items.length}
                  </span>
                )}
              </h2>

              <div className={locked ? "relative" : ""}>
                <ul
                  className={`space-y-3 ${
                    locked ? "pointer-events-none select-none blur-sm" : ""
                  }`}
                  aria-hidden={locked}
                >
                  {phase.items.map((item, ii) => {
                    const id = itemId(pi, ii);
                    const isChecked = !!checked[id];
                    const isNext = !locked && id === nextId;
                    return (
                      <li
                        key={id}
                        className={`relative rounded-lg border bg-white transition-colors duration-150 ${
                          isChecked
                            ? "border-stone-200 opacity-60"
                            : isNext
                              ? "border-stone-400"
                              : "border-stone-200 hover:border-stone-300"
                        } ${isChecked ? "p-3" : "p-4"}`}
                      >
                        {isNext && (
                          <span className="absolute right-3 top-3 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-stone-500 print:hidden">
                            Up next
                          </span>
                        )}
                        <div className="flex items-start gap-3">
                          <CheckToggle
                            id={id}
                            checked={isChecked}
                            onToggle={() => toggle(id)}
                          />
                          <div className="min-w-0 flex-1">
                            <label
                              className="block cursor-pointer"
                              onClick={() => toggle(id)}
                            >
                              <span
                                className={`block text-sm font-medium leading-snug transition-colors duration-150 ${
                                  isChecked
                                    ? "text-stone-400 line-through"
                                    : "text-stone-900"
                                } ${isNext ? "pr-16" : ""}`}
                              >
                                {item.title}
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-400">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium capitalize text-stone-500">
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${categoryDot(item.category)}`}
                                    aria-hidden
                                  />
                                  {item.category}
                                </span>
                                {item.estimate && <span>{item.estimate}</span>}
                                {!isChecked && item.deadline && (
                                  <span className="font-medium text-amber-700">
                                    Due: {item.deadline}
                                  </span>
                                )}
                              </span>
                              {!isChecked && item.why && (
                                <span className="mt-1.5 block text-sm leading-relaxed text-stone-600">
                                  {item.why}
                                </span>
                              )}
                            </label>
                            {!isChecked && item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex max-w-full items-center gap-1 text-xs font-medium text-stone-500 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900 hover:decoration-stone-500"
                              >
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-3.5 w-3.5 shrink-0"
                                  aria-hidden
                                >
                                  <path d="M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5Z" />
                                  <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z" />
                                </svg>
                                <span className="truncate">
                                  {prettyHost(item.url)}
                                </span>
                              </a>
                            )}
                            {!isChecked && item.affiliate && (
                              <a
                                href={item.affiliate.url}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="mt-2 inline-flex max-w-full items-center gap-1 text-xs font-medium text-stone-500 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900 hover:decoration-stone-500"
                              >
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-3.5 w-3.5 shrink-0"
                                  aria-hidden
                                >
                                  <path d="M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5Z" />
                                  <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z" />
                                </svg>
                                <span className="truncate">
                                  {item.affiliate.label}
                                  <span className="font-normal text-stone-400">
                                    {" "}
                                    · partner
                                  </span>
                                </span>
                              </a>
                            )}
                            {!isChecked &&
                              (item.steps?.length ||
                                item.documents?.length ||
                                item.commonMistake ||
                                item.tip ||
                                ((destOffices || originOffices) &&
                                  officeTaskMatch(item))) && (
                                <details className="group/tip mt-2">
                                  <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900 [&::-webkit-details-marker]:hidden">
                                    {item.steps?.length ? "How to do it" : "Tip"}
                                    <svg
                                      viewBox="0 0 16 16"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-3 w-3 text-stone-400 transition-transform group-open/tip:rotate-180"
                                      aria-hidden
                                    >
                                      <path d="M4 6l4 4 4-4" />
                                    </svg>
                                  </summary>
                                  <div className="mt-1.5 space-y-2.5 rounded-md border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm leading-relaxed text-stone-600">
                                    {item.steps && item.steps.length > 0 && (
                                      <ol className="space-y-1.5">
                                        {item.steps.map((step, si) => (
                                          <li key={si} className="flex items-baseline gap-2">
                                            <span className="w-4 shrink-0 text-right text-xs font-medium tabular-nums text-stone-400">
                                              {si + 1}.
                                            </span>
                                            <span className="min-w-0">{step}</span>
                                          </li>
                                        ))}
                                      </ol>
                                    )}
                                    {item.documents && item.documents.length > 0 && (
                                      <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                          Bring / prepare
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {item.documents.map((doc, di) => (
                                            <span
                                              key={di}
                                              className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs text-stone-600"
                                            >
                                              {doc}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {item.commonMistake && (
                                      <p className="text-xs leading-relaxed text-stone-600">
                                        <span className="font-medium text-rose-700">Common mistake:</span>{" "}
                                        {item.commonMistake}
                                      </p>
                                    )}
                                    {item.tip && (
                                      <p className="text-sm">{item.tip}</p>
                                    )}
                                    {officeTaskMatch(item) &&
                                      (() => {
                                        const set = isDepartureOfficeTask(
                                          item,
                                          input.fromCountry,
                                        )
                                          ? originOffices
                                          : destOffices;
                                        return set ? (
                                          <OfficeLinks
                                            offices={set.offices}
                                            capital={set.capital}
                                            curated={set.curated}
                                          />
                                        ) : null;
                                      })()}
                                  </div>
                                </details>
                              )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="pointer-events-auto rounded-lg border border-stone-200 bg-white p-4 text-center shadow-sm">
                      <p className="text-sm font-medium text-stone-700">
                        Unlock the full plan to see this phase
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {!unlocked && (
        <div className="reveal mt-10 rounded-xl border border-stone-200 bg-white p-8 text-center print:hidden">
          <h3 className="text-xl font-semibold tracking-tight text-stone-900">
            Unlock your full relocation plan
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
            Get every phase (wrapping up at home, first week, first month, and
            first 90 days) with all personalized steps, tips, and cost
            estimates.
          </p>
          <button
            onClick={onUnlock}
            disabled={unlocking}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
          >
            {unlocking ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Redirecting…
              </>
            ) : (
              "Unlock full plan for $9"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
