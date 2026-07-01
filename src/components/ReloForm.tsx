"use client";

import { useState } from "react";
import CountryCombobox from "@/components/CountryCombobox";
import { isValidCountry } from "@/lib/allCountries";
import {
  PRIORITY_OPTIONS,
  PROFILES,
  type Profile,
  type ReloInput,
} from "@/lib/types";

interface Props {
  loading: boolean;
  initialTo?: string;
  onSubmit: (input: ReloInput) => void;
}

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-slate-900 shadow-sm outline-none backdrop-blur transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export default function ReloForm({ loading, initialTo, onSubmit }: Props) {
  const [fromCountry, setFromCountry] = useState("");
  const [toCountry, setToCountry] = useState(initialTo ?? "");
  const [profile, setProfile] = useState<Profile>("solo");
  const [visaStatus, setVisaStatus] = useState("");
  const [timeline, setTimeline] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  const fromValid = isValidCountry(fromCountry);
  const toValid = isValidCountry(toCountry);
  const canSubmit = fromValid && toValid && !loading;

  function togglePriority(p: string) {
    setPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({
      fromCountry: fromCountry.trim(),
      toCountry: toCountry.trim(),
      profile,
      visaStatus: visaStatus.trim(),
      timeline: timeline.trim(),
      priorities,
      budget: budget.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="reveal mx-auto w-full max-w-2xl rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-[0_10px_40px_-15px_rgba(15,23,42,0.2)] ring-1 ring-white/60 backdrop-blur-xl sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <CountryCombobox
            label="Moving from"
            value={fromCountry}
            onChange={setFromCountry}
            placeholder="Start typing a country…"
            required
          />
          {touched && !fromValid && (
            <p className="mt-1 text-xs text-rose-500">
              Please pick a country from the list.
            </p>
          )}
        </div>

        <div>
          <CountryCombobox
            label="Moving to"
            value={toCountry}
            onChange={setToCountry}
            placeholder="Start typing a country…"
            required
          />
          {touched && !toValid && (
            <p className="mt-1 text-xs text-rose-500">
              Please pick a country from the list.
            </p>
          )}
        </div>

        <label className="block">
          <span className={labelClass}>Who is moving?</span>
          <select
            className={fieldClass}
            value={profile}
            onChange={(e) => setProfile(e.target.value as Profile)}
          >
            {PROFILES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Timeline</span>
          <input
            className={fieldClass}
            placeholder="e.g. moving in 2 months"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>
            Visa / residency status{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            className={fieldClass}
            placeholder="e.g. EU citizen, work visa, D7 applicant, not sure yet"
            value={visaStatus}
            onChange={(e) => setVisaStatus(e.target.value)}
          />
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className={labelClass}>What matters most? (pick any)</legend>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((p) => {
            const active = priorities.includes(p);
            return (
              <button
                type="button"
                key={p}
                onClick={() => togglePriority(p)}
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 active:scale-95 ${
                  active
                    ? "border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                    : "border-slate-200 bg-white/70 text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>
            Budget <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            className={fieldClass}
            placeholder="e.g. tight, ~$5k for the move"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelClass}>
            Anything else?{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            className={fieldClass}
            placeholder="e.g. bringing a dog, remote job, two kids"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-600/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Building your plan…
          </>
        ) : (
          <>
            Build my relocation plan
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">
        Free preview · Full personalized plan for $9
      </p>
    </form>
  );
}
