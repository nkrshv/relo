"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { setAnalyticsConsent } from "@/lib/analytics";

const STORAGE_KEY = "reloka-consent";
export const OPEN_EVENT = "reloka:open-consent";

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function updateConsent(granted: boolean) {
  const value = granted ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  });
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable; keep the banner hidden.
    }
    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  function decide(granted: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, granted ? "granted" : "denied");
    } catch {
      // ignore write failures
    }
    updateConsent(granted);
    setAnalyticsConsent(granted);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 print:hidden">
      <div className="mx-auto mb-4 flex max-w-xl flex-col gap-4 rounded-xl border border-stone-200 bg-[#fbfbfa] px-5 py-4 shadow-[0_1px_20px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-stone-600">
          We use analytics cookies to understand how Reloka is used. Decline and
          only essential functionality runs.{" "}
          <Link
            href="/legal/privacy-policy"
            className="font-medium text-stone-900 underline underline-offset-2 hover:text-stone-600"
          >
            Privacy Policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide(false)}
            className="rounded-md border border-stone-300 px-3.5 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            className="rounded-md bg-stone-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
