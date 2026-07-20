"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Landing teaser for the Country snapshot + Climate twin. Static, illustrative
 * Amsterdam -> Bangkok data (real values live in CountrySummary at plan time).
 * Bento grid, same stone/amber/emerald language as the rest of the page. One
 * on-scroll reveal (bars grow, cells fade up); no continuous motion, and the
 * whole thing is disabled under prefers-reduced-motion.
 */

const HOME = "Amsterdam";
const DEST = "Bangkok";

// Month temperature (°C) used for the twin bars.
const CLIMATE = [
  { month: "Jan", home: 3, dest: 27 },
  { month: "Jul", home: 18, dest: 29 },
];

// Map a temperature to a bar height %, clamped to a -5..40°C window.
function tempHeight(t: number): number {
  const pct = ((t + 5) / 45) * 100;
  return Math.max(6, Math.min(100, pct));
}

function Icon({ d }: { d: string }) {
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
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  climate:
    "M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8m9.4 0h1.8M3.4 3.4l1.3 1.3m6.6 6.6 1.3 1.3m0-9.2-1.3 1.3M4.7 11.3l-1.3 1.3M8 5.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6Z",
  air: "M2 5.5h7a2 2 0 1 0-2-2M2 8.5h10a2 2 0 1 1-2 2M2 11.5h4.5a1.8 1.8 0 1 1-1.8 1.8",
  money:
    "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 2.5v6m1.8-4.6c-.3-.5-1-.9-1.8-.9-1 0-1.8.6-1.8 1.3 0 1.8 3.6.9 3.6 2.6 0 .7-.8 1.3-1.8 1.3-.8 0-1.5-.4-1.8-.9",
  clock: "M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2Zm0 2.5V8l2.5 1.5",
  tax: "M3.5 12.5 12.5 3.5M5 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
  chat: "M2.5 4.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7l-3 2.5V11.5h-.5a2 2 0 0 1-2-2v-5Z",
  salary:
    "M2.5 5.5h11a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Zm5.5 1.8a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Z",
  visa: "M4 3.5h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Zm2 3.5h4M6 9.5h4M6 12h2.5",
} as const;

function CellShell({
  icon,
  label,
  className = "",
  children,
}: {
  icon: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-stone-200 bg-white p-4 ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <Icon d={icon} />
        <span className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
          {label}
        </span>
      </div>
      <div className="mt-2 flex-1">{children}</div>
    </div>
  );
}

// "home value (muted) -> destination value (accent)" pair with a delta line.
function Twin({
  home,
  dest,
  delta,
  tone = "neutral",
}: {
  home: string;
  dest: string;
  delta: string;
  tone?: "neutral" | "warm" | "cool";
}) {
  const deltaColor =
    tone === "warm"
      ? "text-amber-600"
      : tone === "cool"
        ? "text-sky-600"
        : "text-stone-500";
  return (
    <div>
      <p className="text-lg font-semibold leading-tight text-stone-900">{dest}</p>
      <p className={`mt-1 text-xs font-medium ${deltaColor}`}>{delta}</p>
      <p className="mt-2 text-xs text-stone-400">
        {HOME}: <span className="text-stone-500">{home}</span>
      </p>
    </div>
  );
}

export default function SnapshotTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cell = `transition-all duration-500 ease-out motion-reduce:transition-none ${
    shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
  }`;

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
        See how different home really is, before you land
      </h2>
      <p className="mt-2 max-w-xl text-stone-500">
        Every plan opens with a country snapshot: the weather, air, money and
        day-to-day reality of your destination, always measured against home.
        This one is {HOME} to {DEST}.
      </p>

      <div
        ref={ref}
        className="mt-8 grid auto-rows-[128px] grid-cols-2 gap-3 md:grid-cols-4"
      >
        {/* Climate twin (hero) */}
        <div
          className={`col-span-2 row-span-2 flex flex-col rounded-xl border border-stone-200 bg-white p-5 ${cell}`}
        >
          <div className="flex items-center gap-1.5">
            <Icon d={ICONS.climate} />
            <span className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
              Climate twin
            </span>
          </div>

          <div className="mt-4 flex flex-1 items-end justify-around gap-6">
            {CLIMATE.map((c) => (
              <div key={c.month} className="flex flex-1 flex-col items-center">
                <div className="flex h-28 w-full items-end justify-center gap-3">
                  {/* home bar */}
                  <div className="flex h-full w-8 flex-col items-center justify-end">
                    <span className="mb-1 text-[11px] font-medium text-stone-400">
                      {c.home}°
                    </span>
                    <div
                      className="w-full rounded-t bg-stone-300 transition-[height] duration-700 ease-out motion-reduce:transition-none"
                      style={{ height: shown ? `${tempHeight(c.home)}%` : "0%" }}
                    />
                  </div>
                  {/* destination bar */}
                  <div className="flex h-full w-8 flex-col items-center justify-end">
                    <span className="mb-1 text-[11px] font-semibold text-amber-700">
                      {c.dest}°
                    </span>
                    <div
                      className="w-full rounded-t bg-amber-400 transition-[height] delay-150 duration-700 ease-out motion-reduce:transition-none"
                      style={{ height: shown ? `${tempHeight(c.dest)}%` : "0%" }}
                    />
                  </div>
                </div>
                <span className="mt-2 text-xs text-stone-500">{c.month}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
            <span className="flex items-center gap-1.5 text-stone-500">
              <span className="inline-block h-2 w-2 rounded-sm bg-stone-300" />
              {HOME}
              <span className="ml-2 inline-block h-2 w-2 rounded-sm bg-amber-400" />
              {DEST}
            </span>
            <span className="font-medium text-amber-600">
              Warm all year, no real winter
            </span>
          </div>
        </div>

        {/* Air quality */}
        <CellShell icon={ICONS.air} label="Air quality" className={cell}>
          <Twin home="AQI 22" dest="AQI 156" delta="Much worse than home" tone="warm" />
        </CellShell>

        {/* Money */}
        <CellShell icon={ICONS.money} label="Money" className={cell}>
          <Twin
            home="EUR"
            dest="EUR 1 = THB 39"
            delta="Day-to-day about 45% cheaper"
            tone="cool"
          />
        </CellShell>

        {/* Time difference */}
        <CellShell icon={ICONS.clock} label="Time zone" className={cell}>
          <Twin
            home="UTC+1"
            dest="UTC+7"
            delta="6 hours ahead of home"
          />
        </CellShell>

        {/* Tax regime */}
        <CellShell icon={ICONS.tax} label="Tax regime" className={cell}>
          <div>
            <span className="inline-flex rounded-md bg-stone-100 px-2 py-0.5 text-sm font-medium text-stone-800">
              Remittance-based
            </span>
            <p className="mt-2 text-xs text-stone-400">
              Foreign income taxed when brought in
            </p>
          </div>
        </CellShell>

        {/* Messengers (wide) */}
        <div
          className={`col-span-2 flex flex-col rounded-xl border border-stone-200 bg-white p-4 ${cell}`}
        >
          <div className="flex items-center gap-1.5">
            <Icon d={ICONS.chat} />
            <span className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
              Messengers
            </span>
          </div>
          <div className="mt-3 flex flex-1 items-center gap-4">
            {["WhatsApp", "Telegram", "Signal"].map((m) => (
              <span
                key={m}
                className="flex items-center gap-1.5 text-sm text-stone-700"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m5 12.5 4.5 4.5L19 7" />
                </svg>
                {m}
              </span>
            ))}
            <span className="ml-auto text-xs text-stone-400">Works normally</span>
          </div>
        </div>

        {/* Salary (honest missing value) */}
        <CellShell icon={ICONS.salary} label="Advertised salary" className={cell}>
          <div>
            <span className="text-lg font-semibold text-stone-300">—</span>
            <p className="mt-2 text-xs text-stone-400">
              No reliable data. We show a dash, never a guess.
            </p>
          </div>
        </CellShell>

        {/* Safety */}
        <CellShell icon={ICONS.visa} label="Safety" className={cell}>
          <div>
            <span className="flex items-center gap-2 text-sm font-medium text-stone-800">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Level 1
            </span>
            <p className="mt-2 text-xs text-stone-400">
              Official advisory: normal precautions
            </p>
          </div>
        </CellShell>
      </div>

      <p className="mt-3 text-xs text-stone-400">
        Example route. Live snapshots are built per country from open data at
        plan time.
      </p>
    </section>
  );
}
