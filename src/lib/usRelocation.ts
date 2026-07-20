// US-specific relocation data for the "Moving to X from the USA" pages, keyed
// by destination slug (src/lib/countries.ts). These are facts that only matter
// when the person moving is a US citizen/resident, so they are kept separate
// from the general per-country data.
//
// Two layers:
//  - Tax-treaty and Social-Security-totalization status for every destination,
//    taken from the IRS "Income Tax Treaties A–Z" master list and the SSA
//    totalization list. These are stable, government-published facts.
//  - Fuller per-country detail (how a US citizen applies, driver's-license
//    exchange, key American-specific notes) for the countries where it has been
//    researched and verified against official sources.

// Month these facts were last reviewed.
export const US_RELOCATION_VERIFIED = "2026-07";

// --- Source URLs (official) ---
export const SSA_AGREEMENTS_URL =
  "https://www.ssa.gov/international/agreements_overview.html";
export const IRS_EXPAT_URL =
  "https://www.irs.gov/individuals/international-taxpayers/us-citizens-and-resident-aliens-abroad";
export const IRS_FEIE_URL =
  "https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion";
export const FBAR_URL =
  "https://www.fincen.gov/report-foreign-bank-and-financial-accounts";
export const IRS_TREATIES_URL =
  "https://www.irs.gov/businesses/international-businesses/united-states-income-tax-treaties-a-to-z";

// --- Income tax treaty status ---
// Status of the US income tax treaty with each destination, per the IRS A–Z
// treaty list (rev. Jan 2026) and IRS Announcements 2024-5 (Hungary) and
// 2024-26 (Russia). A treaty can lower withholding on cross-border income and
// set residency tie-breaker rules; it never removes the US filing obligation.
export type TreatyStatus =
  | "in_force"
  | "none"
  | "terminated"
  | "suspended"
  | "signed_not_in_force";

// Slugs NOT listed here default to "none" (no US income tax treaty).
const TAX_TREATY: Record<string, TreatyStatus> = {
  portugal: "in_force",
  spain: "in_force",
  germany: "in_force",
  netherlands: "in_force",
  france: "in_force",
  italy: "in_force",
  ireland: "in_force",
  "united-kingdom": "in_force",
  canada: "in_force",
  australia: "in_force",
  estonia: "in_force",
  poland: "in_force",
  mexico: "in_force",
  thailand: "in_force",
  japan: "in_force",
  greece: "in_force",
  cyprus: "in_force",
  malta: "in_force",
  switzerland: "in_force",
  austria: "in_force",
  czechia: "in_force",
  georgia: "in_force",
  armenia: "in_force",
  turkey: "in_force",
  indonesia: "in_force",
  "new-zealand": "in_force",
  philippines: "in_force",
  "south-korea": "in_force",
  india: "in_force",
  "south-africa": "in_force",
  sweden: "in_force",
  belgium: "in_force",
  // Special statuses:
  hungary: "terminated", // treaty terminated; no effect from 2024 (Ann. 2024-5)
  russia: "suspended", // core articles suspended from Aug 2024 (Ann. 2024-26)
  croatia: "signed_not_in_force", // signed 2022, protocol 2026, awaiting ratification
  // Explicitly no treaty (also the default): UAE, Singapore, Brazil, Argentina,
  // Uruguay, Costa Rica, Panama, Colombia, Malaysia, Vietnam.
};

// Optional first-in-force year, shown only where confidently sourced.
const TREATY_SINCE: Record<string, string> = {
  portugal: "1996",
  spain: "1991",
  thailand: "1998",
  sweden: "1996",
};

// --- Social Security Totalization Agreements ---
// Destinations where the US has an agreement in force. An agreement means a
// posted worker generally pays into only one country's system (no double
// social-security contributions) and coverage periods can be combined for
// benefit eligibility. Independent of the tax treaty — a country can have one
// and not the other (e.g. Hungary has totalization but its tax treaty was
// terminated; Brazil and Uruguay have totalization but no tax treaty).
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
  /** Income tax treaty status. */
  treaty: TreatyStatus;
  /** First-in-force year, when confidently sourced. */
  treatySince?: string;
}

export function usRelocationForSlug(slug: string): UsRelocation {
  return {
    totalization: TOTALIZATION_IN_FORCE.has(slug),
    treaty: TAX_TREATY[slug] ?? "none",
    treatySince: TREATY_SINCE[slug],
  };
}

// --- Per-country detail (verified against official sources) ---
// Fuller US-citizen-specific guidance for the destinations researched so far.
// Countries without an entry simply don't render the detail block (no thin
// placeholder content).
export type LicenseExchange = "full_reciprocity" | "some_states" | "none";

export interface UsCountryDetail {
  /** Days a US passport holder can enter visa-free before a long-stay visa. */
  visaFreeDays: number;
  /** Optional caveat on the visa-free figure. */
  visaFreeNote?: string;
  /** How a US citizen applies for a long-stay visa/residency. */
  howToApply: string;
  /** Main long-stay routes Americans use. */
  longStayRoutes: string[];
  /** Whether a US driver's license can be exchanged without a road test. */
  license: LicenseExchange;
  /** Detail on the license-exchange process. */
  licenseNote: string;
  /** The most important American-specific notes. */
  keyNotes: string[];
  /** An official source to verify against, where one exists. */
  officialUrl?: string;
  officialLabel?: string;
}

const US_COUNTRY_DETAIL: Record<string, UsCountryDetail> = {
  portugal: {
    visaFreeDays: 90,
    howToApply:
      "You file at a Portuguese consulate in the US before departure — Portugal closed the option of entering visa-free and converting to residency from inside the country. The residence permit itself is finished with AIMA after you arrive.",
    longStayRoutes: ["D7 (passive income)", "D8 (digital nomad)"],
    license: "full_reciprocity",
    licenseNote:
      "You can exchange a US license with no road test if you request it within 90 days of getting residency (US Embassy Lisbon's figure). Miss the window and a driving test is required.",
    keyNotes: [
      "The D7 needs proof of stable passive income (about €920/month in 2026) and, at most consulates, that amount already sitting in a Portuguese bank account before the interview.",
      "The FBI background check for the D7/D8 must be apostilled at the federal level — a state-level report is rejected.",
    ],
    officialUrl:
      "https://pt.usembassy.gov/drivers-license-exchange-information-for-u-s-citizens-in-portugal/",
    officialLabel: "US Embassy Lisbon",
  },
  spain: {
    visaFreeDays: 90,
    howToApply:
      "The Non-Lucrative Visa (NLV) is filed at a Spanish consulate in the US before you leave. The Digital Nomad Visa (DNV) is more flexible — file it at a consulate in the US, or enter visa-free and apply from inside Spain within your first 3 months.",
    longStayRoutes: ["Non-Lucrative Visa (NLV)", "Digital Nomad Visa (DNV)"],
    license: "none",
    licenseNote:
      "No US state has a license-exchange deal with Spain's DGT. Your US license (plus an IDP) is valid for the first 6 months of residency; after that you must pass the Spanish theory and practical test (theory is available in English).",
    keyNotes: [
      "The Digital Nomad Visa carries a flat 24% tax rate on work income up to €600,000 (the Beckham Law regime) for up to 6 years, versus standard progressive rates up to 47% — a real planning point for US remote workers and founders.",
      "The NLV requires proving roughly €28,800/year of passive income and does not let you work for any employer from within Spain.",
    ],
  },
  mexico: {
    visaFreeDays: 180,
    howToApply:
      "You cannot apply from inside Mexico. File at a Mexican consulate in the US (MiConsulado appointment system) to get a visa sticker, then complete the mandatory 'canje' at an INM office within 30 days of arriving to get the physical residency card — missing that 30-day window is the most common costly mistake.",
    longStayRoutes: [
      "Residente Temporal (temporary resident)",
      "Residente Permanente",
    ],
    license: "some_states",
    licenseNote:
      "Licenses are issued by Mexican state authorities and each state sets its own rules — some (e.g. Mexico City) allow same-day exchange without a test, others require written and/or practical tests. There is no single national policy.",
    keyNotes: [
      "Under FATCA, Mexican banks report US citizens' account balances directly to the IRS.",
      "There is no totalization agreement, so self-employed Americans get no relief from double social-security contributions if the Mexican side asserts coverage.",
      "The income/savings thresholds are recalculated yearly against Mexico's UMA index, so the exact figures shift annually.",
    ],
  },
  hungary: {
    visaFreeDays: 90,
    howToApply:
      "File at a Hungarian consulate. If approved you get a D-visa (valid 3 months, a 30-day entry window), then finish the residence-permit process in person inside Hungary.",
    longStayRoutes: ["White Card (digital nomad)", "National Visa"],
    license: "none",
    licenseNote:
      "Your US license works for 1 year after you establish residency, with a certified Hungarian translation. After that you must exchange it, which requires at least an oral theory test (and a practical test if the category isn't considered comparable).",
    keyNotes: [
      "The tax treaty is the headline: the US–Hungary income tax treaty was terminated and stopped having effect from Jan 1, 2024, so US-source dividends, interest and royalties lost their reduced treaty rates.",
      "Despite that, the 2016 Social Security Totalization Agreement is untouched and still in force, so double social-security contributions are still avoided — the two agreements are separate.",
      "White Card time does not count toward Hungary's clock for permanent residency or citizenship.",
    ],
  },
  russia: {
    visaFreeDays: 0,
    howToApply:
      "There has never been visa-free entry for US citizens. You obtain a visa in advance, then can request a temporary residence permit (RVP) subject to an annual regional quota. Given the state of relations, US-facing consular capacity is very constrained — verify current routes directly with the specific Russian mission before relying on anything.",
    longStayRoutes: [
      "Temporary Residence Permit (RVP, quota-based)",
      "'Shared Values' private visa",
    ],
    license: "none",
    licenseNote:
      "The US is not party to the road-traffic conventions Russia recognizes for a theory-only conversion, so US-license holders must pass full theory and practical exams once the 60-day post-residency grace period ends.",
    keyNotes: [
      "The August 2024 suspension of the tax treaty's core articles means US-source dividends, interest and royalties lose their reduced withholding rates — similar in effect to Hungary's termination.",
      "There has never been a totalization agreement, so self-employed Americans owe full US self-employment tax with no offset.",
      "This situation is fast-moving and atypical — treat every visa and consular detail here as provisional and re-verify close to the move.",
    ],
  },
  thailand: {
    visaFreeDays: 60,
    visaFreeNote: "extendable once by 30 days (90 total)",
    howToApply:
      "You can't apply from inside Thailand while on the visa-exemption stamp. The Destination Thailand Visa (DTV) is filed online through the Thai e-Visa portal or at a Royal Thai embassy/consulate (Americans often use a nearby-country embassy).",
    longStayRoutes: [
      "DTV (Destination Thailand Visa)",
      "LTR (Long-Term Resident)",
      "Retirement visa (age 50+)",
    ],
    license: "full_reciprocity",
    licenseNote:
      "No full road test to convert a US license, but you still need a residence certificate, medical certificate, a short written theory quiz, basic aptitude tests and a 1-hour e-learning module — and a non-immigrant visa (tourist stamps aren't eligible).",
    keyNotes: [
      "There is a US–Thailand income tax treaty, but no totalization agreement — the treaty does not cover Social Security or self-employment tax, so that exposure is unaffected by Thai residency.",
      "US passport holders get 60 days visa-free on arrival (extendable once by 30 days); some other nationalities were cut to 30 days in 2025–26, but Americans kept 60.",
      "The DTV forbids working for Thailand-based clients or employers — it only covers remote income from abroad.",
    ],
  },
  "united-arab-emirates": {
    visaFreeDays: 90,
    visaFreeNote: "sources vary (some cite 30+30 days) — confirm on u.ae",
    howToApply:
      "US citizens get a free visa on arrival for short stays. For longer stays the Golden Visa and the Remote Work (Virtual Working) Visa are filed after arrival or through ICP digital services; the remote-work route needs no local employer sponsor.",
    longStayRoutes: [
      "Golden Visa (5 or 10 years)",
      "Remote Work / Virtual Working Visa (1 year)",
    ],
    license: "full_reciprocity",
    licenseNote:
      "The US is on the UAE's approved exchange list, so US citizens can convert without a driving test, subject to a standard vision/medical check.",
    keyNotes: [
      "There is no UAE personal income tax, so the lack of a US tax treaty rarely bites on salary — but you remain fully US-taxable on worldwide income, and the Foreign Earned Income Exclusion ($132,900 for 2026) only shields earned income, not investments.",
      "No totalization agreement means self-employed Americans still owe the full 15.3% US self-employment tax with no offset.",
    ],
    officialUrl:
      "https://u.ae/en/information-and-services/visa-and-emirates-id",
    officialLabel: "u.ae",
  },
};

export function usCountryDetailForSlug(slug: string): UsCountryDetail | null {
  return US_COUNTRY_DETAIL[slug] ?? null;
}
