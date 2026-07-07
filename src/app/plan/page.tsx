import type { Metadata } from "next";
import Link from "next/link";
import ReloApp from "@/components/ReloApp";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Build your relocation plan",
  description:
    "Fill in where you're moving from and to, your visa status, family and budget. Get a personalized step-by-step relocation checklist in about a minute.",
  alternates: { canonical: "/plan" },
  openGraph: {
    title: "Build your relocation plan · Reloka",
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
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← Reloka
        </Link>
      </section>

      <section className="pb-12">
        <ReloApp showHeading />
      </section>

      <SiteFooter />
    </main>
  );
}
