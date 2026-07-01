import Link from "next/link";
import ReloApp from "@/components/ReloApp";
import { DESTINATIONS } from "@/lib/countries";

const FEATURES = [
  {
    title: "Tailored to you",
    body: "Origin, destination, visa status, family, budget — every step is specific to your situation, not a generic listicle.",
  },
  {
    title: "Phased timeline",
    body: "Organized into before you go, first week, first month, and first 90 days so you always know what's next.",
  },
  {
    title: "Practical tips",
    body: "Each step explains why it matters plus a concrete tip — the document to prepare or the mistake to avoid.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 pt-16 pb-10 text-center">
        <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
          Moving abroad?
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Your personalized relocation checklist
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Tell us where you&apos;re moving and your situation. Get a clear,
          step-by-step plan — visa, housing, banking, healthcare and more — in
          seconds.
        </p>
      </section>

      <section className="pb-12">
        <ReloApp />
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
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
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-700"
            >
              {d.emoji} Moving to {d.name}
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        ReloChecklist · Not legal or immigration advice — always verify official
        requirements.
      </footer>
    </main>
  );
}
