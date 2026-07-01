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
      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-200 transition-all duration-150 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200"
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
      <section className="mx-auto max-w-3xl px-4 pt-20 pb-14 text-center">
        <span className="reveal inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-sm font-medium text-indigo-700 backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-600" />
          </span>
          Grounded in official data, refreshed monthly
        </span>
        <h1 className="reveal mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Move abroad without the{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            3am panic research
          </span>
        </h1>
        <p className="reveal mx-auto mt-5 max-w-xl text-lg text-slate-600">
          Get a relocation checklist built for your exact situation: your
          route, visa, family and budget. Real office names, real documents,
          real deadlines. Not another generic listicle.
        </p>
        <div className="reveal mt-8 flex flex-col items-center gap-3">
          <CtaButton label="Get my relocation plan" />
          <span className="text-sm text-slate-400">
            Free to generate · takes about a minute
          </span>
        </div>
      </section>

      {/* Pain */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Planning a move abroad usually looks like this
        </h2>
        <ul className="mx-auto mt-8 max-w-xl space-y-3">
          {PAINS.map((p) => (
            <li
              key={p}
              className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/60 p-4 text-slate-700"
            >
              <span className="mt-0.5 text-rose-500" aria-hidden>
                ✗
              </span>
              {p}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-8 max-w-xl text-center text-lg font-semibold text-slate-900">
          One missed deadline can block your bank account, your tax ID and your
          residence permit. You need a plan, not more tabs.
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          How it works
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm shadow-indigo-200">
                {i + 1}
              </div>
              <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          What&apos;s inside every plan
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-white/70 p-3.5 text-sm text-slate-700"
            >
              <span className="mt-0.5 font-bold text-emerald-600" aria-hidden>
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <CtaButton label="Build my checklist now" />
        </div>
      </section>

      {/* Destinations (SEO internal links) */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Popular destinations
        </h2>
        <p className="mt-2 text-center text-slate-600">
          Browse relocation guides for the most popular countries.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {DESTINATIONS.map((d) => (
            <Link
              key={d.slug}
              href={`/moving-to/${d.slug}`}
              className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 hover:shadow-md"
            >
              {d.emoji} Moving to {d.name}
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-slate-200/70 bg-white/70 p-4"
            >
              <summary className="cursor-pointer list-none text-base font-semibold text-slate-900 marker:content-none">
                <span className="flex items-center justify-between gap-2">
                  {f.q}
                  <span className="text-slate-400 transition-transform duration-150 group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Your move, planned in a minute
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-slate-600">
          Stop guessing what to do first. Get the exact steps, documents and
          deadlines for your move.
        </p>
        <div className="mt-8">
          <CtaButton label="Get my relocation plan" />
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        ReloChecklist · Not legal or immigration advice. Always verify official
        requirements.
      </footer>
    </main>
  );
}
