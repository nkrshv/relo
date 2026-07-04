import Link from "next/link";
import { DESTINATIONS } from "@/lib/countries";

const PAINS = [
  "37 open tabs of contradictory visa blog posts from 2019",
  "Reddit threads that say the opposite of the consulate website",
  "Finding out about the 14-day registration deadline on day 13",
  "Generic \"moving abroad\" listicles that fit every country and help with none",
];

const STEPS = [
  {
    title: "Tell us your situation",
    body: "Route, visa status, family, pets, budget, timeline. Takes 60 seconds. Every detail changes the plan.",
  },
  {
    title: "AI builds your checklist",
    body: "Two-pass generation grounded in verified data: U.S. State Department advisories, CDC health notes, live FX rates and curated country facts.",
  },
  {
    title: "Follow it step by step",
    body: "Four phases, real office names, exact documents, hard deadlines and the mistakes everyone makes. Check items off as you go.",
  },
];

const FEATURES = [
  "Real institution names: Finanças, AIMA, Bürgeramt, not \"the local authority\"",
  "Exact documents to bring to every appointment",
  "Hard legal deadlines flagged on each step",
  "The common mistake that trips people up, per step",
  "Family, student and remote-worker specific modules",
  "Pet import rules with real lead times",
  "Official safety levels and health notices per country",
  "Print or save your plan as a PDF",
];

const FAQ = [
  {
    q: "Is it really personalized?",
    a: "Yes. A family with two kids and a dog moving on a D7 visa gets a completely different plan than a solo remote worker. Budget caps, children's ages and spouse job plans are woven into specific steps.",
  },
  {
    q: "Where does the data come from?",
    a: "Safety levels come from official U.S. State Department travel advisories, health info from the CDC, exchange rates from a live FX feed, plus a curated facts layer with visa thresholds, fees and deadlines per country. Snapshots refresh monthly.",
  },
  {
    q: "Is this legal or immigration advice?",
    a: "No. It's a research and planning tool. Every plan links to official sources so you can verify current requirements before acting.",
  },
  {
    q: "How long does it take?",
    a: "About a minute to fill the form, 30 to 60 seconds to generate. The plan is drafted, then reviewed by a second AI pass that removes generic filler.",
  },
];

function CtaButton({ label }: { label: string }) {
  return (
    <Link
      href="/plan"
      className="pressable inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-[background-color,transform] duration-200 hover:bg-stone-700"
    >
      {label}
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M10.3 3.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4-1.4L14.6 11H3a1 1 0 1 1 0-2h11.6l-4.3-4.3a1 1 0 0 1 0-1.4Z" />
      </svg>
    </Link>
  );
}

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Home() {
  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-24 pb-20 text-center">
        <span className="rise inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium tracking-wide text-stone-500">
          Grounded in official data, refreshed monthly
        </span>
        <h1 className="rise rise-1 mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-stone-900 sm:text-6xl">
          Move abroad without the{" "}
          <span className="relative inline-block whitespace-nowrap">
            <span className="absolute -inset-x-1 inset-y-0 -rotate-1 rounded bg-amber-200/70" aria-hidden />
            <span className="relative">3am panic research</span>
          </span>
        </h1>
        <p className="rise rise-2 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-stone-500">
          Get a relocation checklist built for your exact situation: your
          route, visa, family and budget. Real office names, real documents,
          real deadlines. Not another generic listicle.
        </p>
        <div className="rise rise-3 mt-9 flex flex-col items-center gap-3">
          <CtaButton label="Get my relocation plan" />
          <span className="text-sm text-stone-400">
            Free to generate · takes about a minute
          </span>
        </div>
      </section>

      {/* Pain */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          Planning a move abroad usually looks like this
        </h2>
        <ul className="mt-8 max-w-xl divide-y divide-stone-200/70">
          {PAINS.map((p) => (
            <li
              key={p}
              className="flex items-start gap-3 py-3.5 text-sm leading-relaxed text-stone-600"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"
                aria-hidden
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-9 max-w-xl text-lg font-medium leading-snug text-stone-900">
          One missed deadline can block your bank account, your tax ID and your
          residence permit. You need a plan, not more tabs.
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          How it works
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="card-lift rounded-lg border border-stone-200 bg-white p-6 sm:nth-2:col-span-2 sm:last:col-span-2"
            >
              <p className="mb-3 font-mono text-xs font-medium text-stone-400">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="text-base font-semibold text-stone-900">{s.title}</h3>
              <p className="mt-2 text-sm text-stone-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          What&apos;s inside every plan
        </h2>
        <ul className="mt-8 grid gap-x-8 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2.5 border-b border-stone-200/70 py-3 text-sm leading-relaxed text-stone-600"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden
              >
                <path d="M3 8.5l3.5 3.5L13 5" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <CtaButton label="Build my checklist now" />
        </div>
      </section>

      {/* Destinations (SEO internal links) */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          Popular destinations
        </h2>
        <p className="mt-2 text-stone-500">
          Browse relocation guides for the most popular countries.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {DESTINATIONS.map((d) => (
            <Link
              key={d.slug}
              href={`/moving-to/${d.slug}`}
              className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors duration-200 hover:bg-stone-50 hover:text-stone-900"
            >
              Moving to {d.name}
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          Frequently asked questions
        </h2>
        <div className="mt-6">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group border-b border-stone-200/70 py-4"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-stone-900 marker:content-none">
                <span className="flex items-center justify-between gap-2">
                  {f.q}
                  <span className="font-mono text-stone-400 transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-stone-500">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-4 pt-16 pb-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
          Your move, planned in a minute
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-stone-500">
          Stop guessing what to do first. Get the exact steps, documents and
          deadlines for your move.
        </p>
        <div className="mt-8">
          <CtaButton label="Get my relocation plan" />
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-400">
        ReloChecklist · Not legal or immigration advice. Always verify official
        requirements.
      </footer>
    </main>
  );
}
