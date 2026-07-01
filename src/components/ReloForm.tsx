"use client";

import { useState } from "react";
import { DESTINATIONS } from "@/lib/countries";
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

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function ReloForm({ loading, initialTo, onSubmit }: Props) {
  const [fromCountry, setFromCountry] = useState("");
  const [toCountry, setToCountry] = useState(initialTo ?? "");
  const [profile, setProfile] = useState<Profile>("solo");
  const [visaStatus, setVisaStatus] = useState("");
  const [timeline, setTimeline] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  function togglePriority(p: string) {
    setPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromCountry.trim() || !toCountry.trim() || loading) return;
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
      className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Moving from
          </span>
          <input
            className={inputClass}
            placeholder="e.g. United States"
            value={fromCountry}
            onChange={(e) => setFromCountry(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Moving to
          </span>
          <input
            className={inputClass}
            placeholder="e.g. Portugal"
            value={toCountry}
            onChange={(e) => setToCountry(e.target.value)}
            list="destinations"
            required
          />
          <datalist id="destinations">
            {DESTINATIONS.map((d) => (
              <option key={d.slug} value={d.name} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Who is moving?
          </span>
          <select
            className={inputClass}
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
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Timeline
          </span>
          <input
            className={inputClass}
            placeholder="e.g. moving in 2 months"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Visa / residency status{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            className={inputClass}
            placeholder="e.g. EU citizen, work visa, D7 applicant, not sure yet"
            value={visaStatus}
            onChange={(e) => setVisaStatus(e.target.value)}
          />
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium text-slate-700">
          What matters most? (pick any)
        </legend>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((p) => {
            const active = priorities.includes(p);
            return (
              <button
                type="button"
                key={p}
                onClick={() => togglePriority(p)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400"
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
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Budget{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            className={inputClass}
            placeholder="e.g. tight, ~$5k for the move"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Anything else?{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            className={inputClass}
            placeholder="e.g. bringing a dog, remote job, two kids"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !fromCountry.trim() || !toCountry.trim()}
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Building your plan…" : "Build my relocation plan →"}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">
        Free preview. Full personalized plan for $9.
      </p>
    </form>
  );
}
