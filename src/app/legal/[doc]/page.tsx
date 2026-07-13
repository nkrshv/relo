import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SiteFooter from "@/components/SiteFooter";

interface Params {
  doc: string;
}

const DOCS: Record<string, { file: string; title: string; description: string }> = {
  "privacy-policy": {
    file: "privacy-policy.md",
    title: "Privacy Policy",
    description:
      "How Reloka handles your data: no accounts, no card data on our servers, plan inputs sent to OpenAI, and your rights under GDPR and CCPA.",
  },
  "terms-of-service": {
    file: "terms-of-service.md",
    title: "Terms of Service",
    description:
      "The terms governing your use of Reloka: the service, acceptable use, purchases, the AI disclaimer, and your rights and ours.",
  },
  "refund-policy": {
    file: "refund-policy.md",
    title: "Refund Policy",
    description:
      "When and how you can get a refund for a Reloka purchase, including EU/UK withdrawal rights and how to request one.",
  },
};

export function generateStaticParams(): Params[] {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export const dynamicParams = false;

function readDoc(doc: string): string | null {
  const entry = DOCS[doc];
  if (!entry) return null;
  const filePath = path.join(process.cwd(), "legal", entry.file);
  return fs.readFileSync(filePath, "utf8");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { doc } = await params;
  const entry = DOCS[doc];
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.description,
    alternates: { canonical: `/legal/${doc}` },
    openGraph: { title: entry.title, description: entry.description, url: `/legal/${doc}` },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { doc } = await params;
  const content = readDoc(doc);
  if (content === null) notFound();

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-16">
        <Link
          href="/"
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          ← Reloka
        </Link>
        <article className="prose prose-stone mt-6 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-stone-900 prose-a:underline-offset-2 prose-th:text-left">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children, ...props }) => {
                const target =
                  typeof href === "string" && href.startsWith("./")
                    ? `/legal/${href.replace(/^\.\//, "").replace(/\.md$/, "")}`
                    : href;
                const external =
                  typeof target === "string" && target.startsWith("http");
                return (
                  <a
                    href={target}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {content}
          </Markdown>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
