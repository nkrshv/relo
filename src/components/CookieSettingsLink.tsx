"use client";

import { openCookieSettings } from "@/components/CookieBanner";

export default function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="text-stone-500 transition-colors hover:text-stone-900"
    >
      Cookie settings
    </button>
  );
}
