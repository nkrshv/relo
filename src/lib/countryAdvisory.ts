import { normalizeName } from "@/lib/countryFacts";
import {
  COUNTRY_ADVISORY,
  type CountryAdvisory,
  type TravelerImpactEntry,
} from "@/lib/countryAdvisory.generated";
import type { Profile } from "@/lib/types";

export type { CountryAdvisory, TravelerImpactEntry };
export { COUNTRY_ADVISORY };

// Returns the cached travel-advisory snapshot for a destination, or null if we
// have not fetched it (only our curated destinations are covered).
export function advisoryForCountry(country: string): CountryAdvisory | null {
  return COUNTRY_ADVISORY[normalizeName(country)] ?? null;
}

// Maps our relocation profiles onto the API's traveler-impact segments.
const PROFILE_TO_IMPACT: Record<Profile, keyof CountryAdvisory["travelerImpact"]> = {
  solo: "solo",
  couple: "solo",
  family: "family",
  nomad: "remote",
  student: "solo",
};

export function impactForProfile(
  advisory: CountryAdvisory,
  profile: Profile,
): TravelerImpactEntry | undefined {
  return advisory.travelerImpact[PROFILE_TO_IMPACT[profile]];
}
