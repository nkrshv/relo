"use client";

import { useState } from "react";
import Link from "next/link";

function useSubmit(type: "subscribe" | "request-country") {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (value: string) => {
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "subscribe" ? { type, email: value } : { type, country: value },
        ),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Something went wrong. Try again.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setMessage("Something went wrong. Try again.");
      setState("error");
    }
  };

  return { state, message, submit };
}

function InlineForm({
  type,
  placeholder,
  cta,
  doneText,
  inputType,
}: {
  type: "subscribe" | "request-country";
  placeholder: string;
  cta: string;
  doneText: string;
  inputType: "email" | "text";
}) {
  const [value, setValue] = useState("");
  const { state, message, submit } = useSubmit(type);

  if (state === "done") {
    return <p className="text-sm font-medium text-emerald-700">{doneText}</p>;
  }

  return (
    <form
      className="flex w-full max-w-sm gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) void submit(value);
      }}
    >
      <input
        type={inputType}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="pressable shrink-0 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60"
      >
        {state === "sending" ? "…" : cta}
      </button>
      {state === "error" && (
        <p className="w-full text-xs text-red-600">{message}</p>
      )}
    </form>
  );
}

export default function TrustBlock() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
            Why we built this
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
            The internet is full of relocation advice that was true in 2023
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
            Portugal&apos;s famous NHR tax regime closed to new applicants at the
            end of 2023. Greece doubled its golden visa thresholds. Malta&apos;s
            citizenship program was ruled illegal by the EU&apos;s top court.
            Plenty of sites still sell all three as current. We got burned by
            exactly this kind of stale advice on our own moves, so every fact
            here carries a source and a verification date, and the data layers
            refresh automatically.
          </p>
          <p className="mt-3 text-sm text-stone-500">
            Spot something outdated?{" "}
            <Link
              href="/compare"
              className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
            >
              Check any two countries side by side
            </Link>{" "}
            and see the dates for yourself.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-stone-900">
              Get the monthly changelog
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              One email a month: which visa rules, tax regimes and thresholds
              actually changed. No listicles.
            </p>
            <div className="mt-3">
              <InlineForm
                type="subscribe"
                inputType="email"
                placeholder="you@example.com"
                cta="Subscribe"
                doneText="You're in. First changelog next month."
              />
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-stone-900">
              Missing your destination?
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              Plans work for 238 routes already; deep guides cover 18 countries.
              Tell us where to research next.
            </p>
            <div className="mt-3">
              <InlineForm
                type="request-country"
                inputType="text"
                placeholder="e.g. Vietnam"
                cta="Request"
                doneText="Noted. We prioritize by requests."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
