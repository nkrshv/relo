import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { ArrowRightIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-24 pb-20 text-center">
        <p className="font-mono text-sm font-medium text-stone-500">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          This page moved on without you
        </h1>
        <p className="mt-4 max-w-md text-lg text-stone-500">
          The link may be broken, or a saved plan link may have expired. Plan
          links are private, so double-check you have the full one.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            Start a plan
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
          >
            Back home
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
