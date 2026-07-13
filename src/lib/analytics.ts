import mixpanel from "mixpanel-browser";

// Public, client-side project token (Mixpanel tokens are meant to ship in the
// browser bundle). Overridable via env so different environments can split data.
const MIXPANEL_TOKEN =
  process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? "543a8c0c6ac17368ab7f021ec6fe414d";

// The project has EU data residency, so events must go to the EU ingestion
// endpoint. Events sent to the default US host are accepted (HTTP 200) but
// never ingested. Overridable for a US/other-region project.
const MIXPANEL_API_HOST =
  process.env.NEXT_PUBLIC_MIXPANEL_API_HOST ?? "https://api-eu.mixpanel.com";

const CONSENT_KEY = "reloka-consent";

let initialized = false;

function hasConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

/**
 * Initialize Mixpanel once, tracking disabled by default. No events are sent
 * until the visitor opts in, so nothing fires before cookie consent (GDPR/
 * ePrivacy safe). If the visitor already consented in a prior session we
 * opt in immediately.
 */
export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  mixpanel.init(MIXPANEL_TOKEN, {
    api_host: MIXPANEL_API_HOST,
    persistence: "localStorage",
    track_pageview: false,
    opt_out_tracking_by_default: true,
    debug: process.env.NODE_ENV !== "production",
  });
  if (hasConsent()) mixpanel.opt_in_tracking();
}

/** Called by the cookie banner when the visitor accepts or declines. */
export function setAnalyticsConsent(granted: boolean) {
  if (typeof window === "undefined") return;
  initAnalytics();
  if (granted) mixpanel.opt_in_tracking();
  else mixpanel.opt_out_tracking();
}

/**
 * Track an event. Safe to call anytime: when the visitor has not consented
 * Mixpanel is opted out and the call is a no-op.
 */
export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // Lazily init so an event fired before AnalyticsInit's effect (e.g. a mount
  // effect earlier in the tree) still initializes Mixpanel first. Safe: init
  // opts out by default, so this never leaks events before consent.
  initAnalytics();
  mixpanel.track(event, props);
}
