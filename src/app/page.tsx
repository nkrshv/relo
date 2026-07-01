import Link from "next/link";
import ReloApp from "@/components/ReloApp";
import { DESTINATIONS } from "@/lib/countries";

const FEATURES = [
  {
    title: "Tailored to you",
    body: "Origin, destination, visa status, family, budget — every step is specific to your situation, not a generic listicle.",
    icon: (
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.9 0-7 2.5-7 5.5 0 .8.6 1.5 1.4 1.5h11.2c.8 0 1.4-.7 1.4-1.5 0-3-3.1-5.5-7-5.5Z" />
    ),
  },
  {
    title: "Phased timeline",
    body: "Organized into before you go, first week, first month, and first 90 days so you always know what's next.",
    icon: (
      <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm.9 4a.9.9 0 0 0-1.8 0v5c0 .3.1.6.4.8l3.3 2.4a.9.9 0 1 0 1-1.5l-2.9-2.1V7Z" />
    ),
  },
  {
    title: "Practical tips",
    body: "Each step explains why it matters plus a concrete tip — the document to prepare or the mistake to avoid.",
    icon: (
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.4 1 1.1 1 1.8v.5h6v-.5c0-.7.4-1.4 1-1.8A7 7 0 0 0 12 2ZM9 19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-.5H9V19Zm1 2.5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V21h-4v.5Z" />
    ),
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 pt-20 pb-10 text-center print:hidden">
        <span className="reveal inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-sm font-medium text-indigo-700 backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-600" />
          </span>
          Moving abroad?
        </span>
        <h1 className="reveal mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Your personalized{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            relocation checklist
          </span>
        </h1>
        <p className="reveal mx-auto mt-5 max-w-xl text-lg text-slate-600">
          Tell us where you&apos;re moving and your situation. Get a clear,
          step-by-step plan — visa, housing, banking, healthcare and more — in
          seconds.
        </p>
      </section>

      <section className="pb-12">
        <ReloApp />
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 print:hidden">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-200 transition-transform duration-200 group-hover:scale-110">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden
                >
                  {f.icon}
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 print:hidden">
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

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400 print:hidden">
        ReloChecklist · Not legal or immigration advice — always verify official
        requirements.
      </footer>
    </main>
  );
}
