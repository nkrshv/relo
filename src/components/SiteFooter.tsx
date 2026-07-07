import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-10 text-center">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-stone-900 transition-colors hover:text-stone-600"
        >
          Reloka
        </Link>
        <p className="text-sm text-stone-500">Made for expats, by expats</p>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
          <Link
            href="/plan"
            className="text-stone-500 transition-colors hover:text-stone-900"
          >
            Build a plan
          </Link>
          <Link
            href="/compare"
            className="text-stone-500 transition-colors hover:text-stone-900"
          >
            Compare countries
          </Link>
        </nav>
        <p className="max-w-md text-xs leading-relaxed text-stone-400">
          Not legal, tax or immigration advice. Always verify official
          requirements.
        </p>
      </div>
    </footer>
  );
}
