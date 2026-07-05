import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReloApp from "@/components/ReloApp";
import { DESTINATIONS, findDestination } from "@/lib/countries";

interface Params {
  country: string;
}

export function generateStaticParams(): Params[] {
  return DESTINATIONS.map((d) => ({ country: d.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { country } = await params;
  const dest = findDestination(country);
  if (!dest) return {};
  const title = `Moving to ${dest.name}: relocation checklist`;
  const description = `A step-by-step checklist for moving to ${dest.name}: visa and residency, housing, banking, healthcare, taxes and more. Get a free personalized plan.`;
  return {
    title,
    description,
    alternates: { canonical: `/moving-to/${dest.slug}` },
    openGraph: { title, description, url: `/moving-to/${dest.slug}` },
  };
}

const OUTLINE: { phase: string; items: string[] }[] = [
  {
    phase: "Before you go",
    items: [
      "Confirm which visa or residency route fits your situation",
      "Gather and, where needed, apostille/translate key documents",
      "Sort out international health insurance for the gap period",
      "Budget the move and notify your bank of the relocation",
    ],
  },
  {
    phase: "First week",
    items: [
      "Register your address with the local authority",
      "Get a local SIM / mobile number",
      "Start the local bank account application",
      "Locate the nearest clinic and pharmacy",
    ],
  },
  {
    phase: "First month",
    items: [
      "Complete residency registration and get your ID number",
      "Enroll in the healthcare system or private insurance",
      "Set up utilities and a long-term rental contract",
      "Understand your tax residency obligations",
    ],
  },
  {
    phase: "First 90 days",
    items: [
      "Exchange or apply for a local driving license if required",
      "Build a local support network and language basics",
      "Review and optimize banking, taxes, and insurance",
      "Handle school enrollment or childcare if you have kids",
    ],
  },
];

export default async function MovingToPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country } = await params;
  const dest = findDestination(country);
  if (!dest) notFound();

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-8 text-center print:hidden">
        <Link
          href="/"
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← ReloChecklist
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Moving to {dest.name}: your relocation checklist
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
          Everything you need to settle into {dest.name}, organized by phase.
          Generate a free plan tailored to your visa status, family, and
          budget below.
        </p>
      </section>

      <section className="pb-10">
        <ReloApp initialTo={dest.name} />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 print:hidden">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          The {dest.name} relocation checklist at a glance
        </h2>
        <div className="mt-6 space-y-8">
          {OUTLINE.map((block, i) => (
            <div key={block.phase}>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-stone-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-300 bg-white text-xs font-medium text-stone-600">
                  {i + 1}
                </span>
                {block.phase}
              </h3>
              <ul className="mt-2 divide-y divide-stone-200/70">
                {block.items.map((item) => (
                  <li key={item} className="py-2.5 text-sm text-stone-600">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 rounded-lg border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-500">
          This is a general outline. Your personalized plan above adapts every
          step to where you&apos;re moving from, your visa status, and your
          situation. Always verify official requirements: this is not legal or
          immigration advice.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 print:hidden">
        <h2 className="text-center text-lg font-semibold text-stone-900">
          Other destinations
        </h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {DESTINATIONS.filter((d) => d.slug !== dest.slug).map((d) => (
            <Link
              key={d.slug}
              href={`/moving-to/${d.slug}`}
              className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
            >
              {d.name}
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-400 print:hidden">
        ReloChecklist · Not legal or immigration advice. Always verify official
        requirements.
      </footer>
    </main>
  );
}
