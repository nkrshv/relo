import Link from "next/link";
import { DESTINATIONS } from "@/lib/countries";
import Spotlight from "@/components/Spotlight";
import Typewriter from "@/components/Typewriter";
import PipelineDiagram from "@/components/PipelineDiagram";
import SnapshotTeaser from "@/components/SnapshotTeaser";
import TrustBlock from "@/components/TrustBlock";
import ScrollRoad from "@/components/ScrollRoad";
import SiteFooter from "@/components/SiteFooter";

const TYPE_CITIES = [
  "Lisbon",
  "Berlin",
  "Toronto",
  "Tokyo",
  "Madrid",
  "Dublin",
  "Vienna",
];

const PAINS = [
  "37 open tabs of contradictory visa blog posts from 2019",
  "Reddit threads that say the opposite of the consulate website",
  "Finding out about the 14-day registration deadline on day 13",
  "Generic \"moving abroad\" listicles that fit every country and help with none",
];

const STEPS = [
  {
    title: "Tell us about your move",
    body: "Where you're going, who's coming with you (kids, pets, partner), the passports you hold, your visa situation, timeline and budget. About a minute, and every answer changes your plan.",
  },
  {
    title: "Get a plan that's actually yours",
    body: "Not another generic moving abroad list. Your visa route checked on the strongest passport you hold, the entry rules and documents to sort before you fly, the real offices in your new city, and every task in the order it unlocks, so you never sit waiting on a step you could have started weeks earlier.",
  },
  {
    title: "Check things off, at your own pace",
    body: "From before you book flights to your first 90 days: what to pack (with the weather compared to home), where to go, and the costly mistake people make at each step. Tick items off, close the tab, and pick up where you left off on any device.",
  },
];

const PLAN_FEATURES = [
  "Real institution names: Finanças, AIMA, Bürgeramt, not \"the local authority\"",
  "The exact documents to bring to every appointment",
  "Tasks in the order they unlock, so nothing quietly blocks you",
  "Entry rules to sort before you fly: apostille or legalization, and pre-arrival registrations like TDAC, ETA or ESTA",
  "The costly mistake people make at each step, and its real consequence",
  "Family, student and remote-worker modules that reshape the plan",
  "Pet import rules with real microchip and rabies lead times",
  "A packing list built from how the weather compares to home",
];

const SNAPSHOT_FEATURES = [
  "Your visa verdict, checked on the strongest passport you hold",
  "Cost of living and prices, converted into your home currency",
  "A climate twin: temperature and air quality against where you live now",
  "Typical advertised salaries and the local tax regime",
  "Whether WhatsApp, Telegram and Signal actually work there",
  "Official government travel-advisory levels",
];

const KEEP_FEATURES = [
  "A permanent private link that reopens your plan on any device",
  "Your checklist progress saved as you go, so you can stop and resume anytime",
  "The link emailed to you when you unlock, plus PDF and Markdown export",
];

const FAQ = [
  {
    q: "Is it really personalized?",
    a: "Yes, that's the whole point. A family with two kids and a dog gets a completely different plan than a solo remote worker on the same route. Your budget, your kids' ages, your partner's job plans become concrete steps, not footnotes.",
  },
  {
    q: "Can I trust the information?",
    a: "It comes from the sources you'd check yourself if you had the time: official government travel advisories, the passport-index visa matrix, live exchange rates, and open climate, cost and salary data. Every fact is labelled with its source and, where it matters, the date we last checked it, so verifying anything takes one click instead of an evening. Where we don't have a number for a country, we show a dash rather than guess.",
  },
  {
    q: "Is this legal or immigration advice?",
    a: "No, it's the research assistant you wish you had. It tells you what to do, when, and where to double-check it. If your case is tricky, the plan is also the fastest way to brief an actual immigration lawyer.",
  },
  {
    q: "Can I come back to my plan later, or on another device?",
    a: "Yes. Every plan gets its own private link, so you can reopen it on your phone or laptop and your checklist remembers what you've already ticked off. There's nothing to log into. Unlock the full plan and we also email you the link, so it's yours to keep.",
  },
  {
    q: "What if I'm moving somewhere less common?",
    a: "You can plan a move between 143 countries, in any direction. The most popular destinations have the deepest country data; for the rest we fill in what we can from live sources (like climate and exchange rates) and stay honest with a dash wherever we don't have a figure.",
  },
  {
    q: "How long does it take?",
    a: "About a minute to answer the questions, under a minute to get your plan. People spend weeks piecing the same answers together from forums and outdated blog posts. That's the part you skip.",
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

function FeatureGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {title}
      </h3>
      <ul className="mt-2">
        {items.map((f) => (
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
    </div>
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
    <main className="relative isolate flex-1">
      <ScrollRoad />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-24 pb-20 text-center">
        <h1 className="rise rise-1 text-4xl font-semibold leading-[1.1] tracking-tight text-stone-900 sm:text-6xl">
          Move to <Typewriter words={TYPE_CITIES} /> without the{" "}
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
          <span className="text-sm text-stone-500">
            Free plan in about a minute, full checklist $9
          </span>
        </div>
      </section>

      {/* Pain */}
      <section className="mx-auto max-w-5xl px-4 py-16">
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
        <PipelineDiagram />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Spotlight
              key={s.title}
              className="card-lift rounded-lg border border-stone-200 bg-white p-6 sm:nth-2:col-span-2 sm:last:col-span-2"
            >
              <p className="mb-3 font-mono text-xs font-medium text-stone-500">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="text-base font-semibold text-stone-900">{s.title}</h3>
              <p className="mt-2 text-sm text-stone-500">{s.body}</p>
            </Spotlight>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          What&apos;s inside every plan
        </h2>
        <p className="mt-2 max-w-xl text-stone-500">
          A step-by-step checklist for your exact route, a snapshot of the
          country you&apos;re moving to, and a plan you can keep.
        </p>

        <div className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2">
          <FeatureGroup title="Your step-by-step checklist" items={PLAN_FEATURES} />
          <FeatureGroup title="Your country snapshot" items={SNAPSHOT_FEATURES} />
        </div>

        <div className="mt-8 max-w-3xl">
          <FeatureGroup title="And it stays yours" items={KEEP_FEATURES} />
        </div>

        <div className="mt-10 text-center">
          <CtaButton label="Build my checklist now" />
        </div>
      </section>

      {/* Snapshot / Climate twin teaser */}
      <SnapshotTeaser />

      {/* Trust: why we built this, request a country */}
      <TrustBlock />

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
        <p className="mt-4 text-sm text-stone-500">
          Torn between two countries?{" "}
          <Link
            href="/compare"
            className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900"
          >
            Compare them side by side
          </Link>
          .
        </p>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          Frequently asked questions
        </h2>
        <div className="mt-6 max-w-2xl">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="faq-details group border-b border-stone-200/70 py-4"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-stone-900 marker:content-none">
                <span className="flex items-center justify-between gap-2">
                  {f.q}
                  <span className="font-mono text-stone-500 transition-transform duration-200 group-open:rotate-45">
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

      <SiteFooter />
    </main>
  );
}
