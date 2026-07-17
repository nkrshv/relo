"use client";

import { useState } from "react";
import CountryCombobox from "@/components/CountryCombobox";
import CityCombobox from "@/components/CityCombobox";
import { isValidCountry } from "@/lib/allCountries";
import { originForCountry } from "@/lib/countryOrigin";
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
  onRouteChange?: (
    fromCountry: string,
    toCountry: string,
    fromCity?: string,
    toCity?: string,
  ) => void;
}

const fieldClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-500 focus:border-stone-500 focus:ring-2 focus:ring-stone-200";

const labelClass = "mb-1.5 block text-sm font-medium text-stone-700";

export default function ReloForm({
  loading,
  initialTo,
  onSubmit,
  onRouteChange,
}: Props) {
  const [fromCountry, setFromCountry] = useState("");
  const [toCountry, setToCountry] = useState(initialTo ?? "");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [profile, setProfile] = useState<Profile>("solo");
  const [citizenships, setCitizenships] = useState<string[]>([]);
  const [citizenshipDraft, setCitizenshipDraft] = useState("");
  const [visaStatus, setVisaStatus] = useState("");
  const [timeline, setTimeline] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  const fromValid = isValidCountry(fromCountry);
  const toValid = isValidCountry(toCountry);
  const sameCountry =
    fromValid && toValid && fromCountry.trim() === toCountry.trim();
  // Country-aware example city so the hint never suggests a city from the
  // wrong country (Albania should say "e.g. Tirana", not "e.g. Mumbai").
  const cityExample = (country: string, fallback: string) => {
    const capital = originForCountry(country)?.capital;
    return `e.g. ${capital || fallback}`;
  };
  const canSubmit = fromValid && toValid && !sameCountry && !loading;

  function togglePriority(p: string) {
    setPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  // The combobox fires onChange on every keystroke; a full valid country name
  // only appears once a suggestion is picked (or typed out), so that is when we
  // commit it as a chip and clear the input for the next one.
  function addCitizenship(v: string) {
    setCitizenshipDraft(v);
    const name = v.trim();
    if (
      isValidCountry(name) &&
      !citizenships.some((c) => c.toLowerCase() === name.toLowerCase())
    ) {
      setCitizenships((prev) => [...prev, name]);
      setCitizenshipDraft("");
    }
  }

  function removeCitizenship(name: string) {
    setCitizenships((prev) => prev.filter((c) => c !== name));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({
      fromCountry: fromCountry.trim(),
      toCountry: toCountry.trim(),
      fromCity: fromCity.trim() || undefined,
      toCity: toCity.trim() || undefined,
      profile,
      citizenships,
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
      className="reveal mx-auto w-full max-w-2xl rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <CountryCombobox
            label="Moving from"
            value={fromCountry}
            onChange={(v) => {
              setFromCountry(v);
              setFromCity("");
              onRouteChange?.(v, toCountry, "", toCity);
            }}
            placeholder="Start typing a country…"
            required
            exclude={toValid ? toCountry : undefined}
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
            onChange={(v) => {
              setToCountry(v);
              setToCity("");
              onRouteChange?.(fromCountry, v, fromCity, "");
            }}
            placeholder="Start typing a country…"
            required
            exclude={fromValid ? fromCountry : undefined}
          />
          {touched && !toValid && (
            <p className="mt-1 text-xs text-rose-500">
              Please pick a country from the list.
            </p>
          )}
          {sameCountry && (
            <p className="mt-1 text-xs text-rose-500">
              You&apos;re already there. Pick a different destination.
            </p>
          )}
        </div>

        {fromValid && (
          <CityCombobox
            label="City you're leaving"
            country={fromCountry}
            value={fromCity}
            onChange={(v) => {
              setFromCity(v);
              onRouteChange?.(fromCountry, toCountry, v, toCity);
            }}
            placeholder={cityExample(fromCountry, "Mumbai")}
          />
        )}

        {toValid && (
          <CityCombobox
            label="City you're heading to"
            country={toCountry}
            value={toCity}
            onChange={(v) => {
              setToCity(v);
              onRouteChange?.(fromCountry, toCountry, fromCity, v);
            }}
            placeholder={cityExample(toCountry, "Sydney")}
          />
        )}

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

        <div className="sm:col-span-2">
          <CountryCombobox
            label="Citizenships / passports you hold (optional)"
            value={citizenshipDraft}
            onChange={addCitizenship}
            placeholder="Add each passport you hold, e.g. Netherlands"
          />
          {citizenships.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {citizenships.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-stone-50 px-2.5 py-1 text-sm text-stone-700"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCitizenship(c)}
                    aria-label={`Remove ${c}`}
                    className="text-base leading-none text-stone-500 transition-colors hover:text-stone-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="mt-1.5 text-xs text-stone-500">
            Hold more than one? We check each and base your visa route on the
            strongest passport for this destination.
          </p>
        </div>

        <label className="block sm:col-span-2">
          <span className={labelClass}>
            Visa / residency status{" "}
            <span className="font-normal text-stone-500">(optional)</span>
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
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900"
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
            Budget <span className="font-normal text-stone-500">(optional)</span>
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
            <span className="font-normal text-stone-500">(optional)</span>
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
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Building your plan…
          </>
        ) : (
          <>Build my relocation plan →</>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-stone-500">
        Free preview · Full personalized plan for $9
      </p>
    </form>
  );
}
