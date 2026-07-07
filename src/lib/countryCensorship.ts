// Accessors over the OONI messenger-reachability snapshot
// (countryCensorship.generated.ts) plus display helpers.

import {
  COUNTRY_CENSORSHIP,
  CENSORSHIP_UPDATED_AT,
  type CountryCensorship,
  type MessengerReachability,
  type Reachability,
} from "./countryCensorship.generated";
import { normalizeName } from "./countryFacts";

const BY_NORM: Record<string, CountryCensorship> = Object.fromEntries(
  Object.entries(COUNTRY_CENSORSHIP).map(([name, v]) => [normalizeName(name), v]),
);

export function censorshipForCountry(country: string): CountryCensorship | null {
  return BY_NORM[normalizeName(country)] ?? null;
}

export { CENSORSHIP_UPDATED_AT };
export type { CountryCensorship, MessengerReachability, Reachability };

/** Plain-language label and tone for a reachability status. */
export function reachabilityLabel(status: Reachability): {
  text: string;
  tone: "good" | "moderate" | "bad";
} {
  if (status === "reachable") return { text: "Works normally", tone: "good" };
  if (status === "disrupted")
    return { text: "Some interference reported", tone: "moderate" };
  return { text: "Frequently disrupted", tone: "bad" };
}

/** True when every measured messenger is reachable. */
export function allMessengersReachable(c: CountryCensorship): boolean {
  return c.messengers.every((m) => m.status === "reachable");
}

/** Messengers with reported interference, worst first. */
export function disruptedMessengers(c: CountryCensorship): MessengerReachability[] {
  return c.messengers
    .filter((m) => m.status !== "reachable")
    .sort((a, b) => b.rate - a.rate);
}
