// US-specific relocation data for the "Moving to X from the USA" pages, keyed
// by destination slug (src/lib/countries.ts). These are facts that only matter
// when the person moving is a US citizen/resident, so they are kept separate
// from the general per-country data.
//
// Currently this covers Social Security Totalization Agreements (a stable,
// SSA-published list). Income-tax-treaty status, US-citizen visa specifics and
// driver's-license reciprocity are added per country as they are verified
// against official sources.

// Month these facts were last reviewed.
export const US_RELOCATION_VERIFIED = "2026-07";

// SSA Social Security Totalization Agreements — destinations where the US has
// an agreement in force. An agreement means a posted worker generally pays into
// only one country's system (no double social-security contributions) and that
// coverage periods can be combined for benefit eligibility.
// Source: https://www.ssa.gov/international/agreements_overview.html
const TOTALIZATION_IN_FORCE = new Set<string>([
  "portugal",
  "spain",
  "germany",
  "netherlands",
  "france",
  "italy",
  "ireland",
  "united-kingdom",
  "canada",
  "australia",
  "poland",
  "japan",
  "greece",
  "switzerland",
  "austria",
  "czechia",
  "brazil",
  "uruguay",
  "south-korea",
  "sweden",
  "belgium",
  "hungary",
]);

export interface UsRelocation {
  /** Whether the US has a Social Security Totalization Agreement in force. */
  totalization: boolean;
}

export function usRelocationForSlug(slug: string): UsRelocation {
  return { totalization: TOTALIZATION_IN_FORCE.has(slug) };
}

export const SSA_AGREEMENTS_URL =
  "https://www.ssa.gov/international/agreements_overview.html";
export const IRS_EXPAT_URL =
  "https://www.irs.gov/individuals/international-taxpayers/us-citizens-and-resident-aliens-abroad";
export const IRS_FEIE_URL =
  "https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion";
export const FBAR_URL =
  "https://www.fincen.gov/report-foreign-bank-and-financial-accounts";
