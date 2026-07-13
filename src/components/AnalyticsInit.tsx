"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

/** Initializes Mixpanel once on the client (tracking stays opted out until consent). */
export default function AnalyticsInit() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
