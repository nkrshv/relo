import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/siteUrls";
import { GLOSSARY, type GlossaryTerm } from "@/lib/glossary";

const CATEGORY_LABELS: Record<GlossaryTerm["category"], string> = {
  visas: "Visas & residence",
  documents: "Documents",
  taxes: "Taxes",
  "us-taxes": "US taxes abroad",
  registration: "Local registration & IDs",
};

const CATEGORY_ORDER: GlossaryTerm["category"][] = [
  "visas",
  "documents",
  "taxes",
  "us-taxes",
  "registration",
];

export const metadata: Metadata = {
  title: "Relocation glossary: visa, tax and paperwork terms explained",
  description:
    "Plain-English definitions of the terms you meet when moving abroad — digital nomad visa, golden visa, apostille, NIF, NIE, FEIE, FBAR, totalization agreement and more.",
  alternates: { canonical: "/glossary" },
  openGraph: {
    title: "Relocation glossary",
    description:
      "Plain-English definitions of visa, tax and paperwork terms for moving abroad.",
    url: "/glossary",
  },
};

export default function GlossaryIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Reloka", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Relocation glossary",
        item: `${SITE_URL}/glossary`,
      },
    ],
  };

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-8 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← Reloka
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Relocation glossary
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
          The visa, tax and paperwork terms you meet when moving abroad, in
          plain English — with links to the official source and the countries
          they matter for.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16">
        {CATEGORY_ORDER.map((cat) => {
          const terms = GLOSSARY.filter((t) => t.category === cat);
          if (terms.length === 0) return null;
          return (
            <div key={cat} className="mb-8">
              <h2 className="text-xs font-medium uppercase tracking-wider text-stone-500">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {terms.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/glossary/${t.slug}`}
                    className="rounded-lg border border-stone-200 bg-white px-4 py-3 transition-colors hover:bg-stone-50"
                  >
                    <p className="text-sm font-semibold text-stone-900">
                      {t.term}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
                      {t.short}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <SiteFooter />
    </main>
  );
}
