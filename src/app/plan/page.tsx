import type { Metadata } from "next";
import Link from "next/link";
import ReloApp from "@/components/ReloApp";

export const metadata: Metadata = {
  title: "Build your relocation plan",
  description:
    "Fill in where you're moving from and to, your visa status, family and budget. Get a personalized step-by-step relocation checklist in about a minute.",
  alternates: { canonical: "/plan" },
  openGraph: {
    title: "Build your relocation plan · ReloChecklist",
    description:
      "A personalized, step-by-step relocation checklist based on your route, visa status, family and budget.",
    url: "/plan",
  },
};

export default function PlanPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-8 text-center print:hidden">
        <Link
          href="/"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← ReloChecklist
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Build your relocation plan
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          The more you tell us, the more specific your plan gets. Visa status,
          kids, pets, budget: every detail changes the checklist.
        </p>
      </section>

      <section className="pb-12">
        <ReloApp />
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400 print:hidden">
        ReloChecklist · Not legal or immigration advice. Always verify official
        requirements.
      </footer>
    </main>
  );
}
