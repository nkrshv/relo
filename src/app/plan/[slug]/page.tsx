import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SavedPlan from "@/components/SavedPlan";
import SiteFooter from "@/components/SiteFooter";
import { getPlan, visiblePlan } from "@/lib/planStore";
import { SITE_URL } from "@/lib/siteUrls";

// Always render on-demand so the latest saved/paid state is reflected.
export const dynamic = "force-dynamic";

// Capability links are private to whoever holds them: never index or follow.
export const metadata: Metadata = {
  title: "Your relocation plan",
  robots: { index: false, follow: false },
};

export default async function SavedPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getPlan(slug);
  if (!record) notFound();

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

      <section className="px-4 pb-12">
        <SavedPlan
          slug={slug}
          input={record.input}
          plan={visiblePlan(record)}
          visa={record.visa}
          paid={record.paid}
          shareUrl={`${SITE_URL}/plan/${slug}`}
        />
      </section>

      <SiteFooter />
    </main>
  );
}
