import Link from "next/link";
import CookieSettingsLink from "@/components/CookieSettingsLink";

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
          <Link
            href="/legal/privacy-policy"
            className="text-stone-500 transition-colors hover:text-stone-900"
          >
            Privacy
          </Link>
          <Link
            href="/legal/terms-of-service"
            className="text-stone-500 transition-colors hover:text-stone-900"
          >
            Terms
          </Link>
          <Link
            href="/legal/refund-policy"
            className="text-stone-500 transition-colors hover:text-stone-900"
          >
            Refunds
          </Link>
          <CookieSettingsLink />
          <a
            href="mailto:hey@reloka.to"
            aria-label="Email us at hey@reloka.to"
            className="inline-flex items-center text-stone-500 transition-colors hover:text-stone-900"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </a>
        </nav>
        <p className="max-w-md text-xs leading-relaxed text-stone-500">
          Not legal, tax or immigration advice. Always verify official
          requirements.
        </p>
      </div>
    </footer>
  );
}
