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
  vietnam: "signed_not_in_force", // 2015 treaty signed but never ratified/in force
  // Explicitly no treaty (also the default): UAE, Singapore, Brazil, Argentina,
  // Uruguay, Costa Rica, Panama, Colombia, Malaysia.
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

// --- Per-country detail (researched against official sources) ---
// Fuller US-citizen-specific guidance for each destination: how a US citizen
// applies, visa-free days, main long-stay routes, driver's-license exchange and
// the key American-specific gotchas. Countries without an entry simply don't
// render the detail block (no thin placeholder content).
export type LicenseExchange = "full_reciprocity" | "some_states" | "none";

export interface UsCountryDetail {
  /**
   * Days a US passport holder can enter visa-free before a long-stay visa.
   * `null` when no visa-free entry exists (a visa/eVisa is required in advance).
   */
  visaFreeDays: number | null;
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
  "germany": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days. Unlike many other nationals, US citizens can apply for a residence permit locally in Germany within 90 days of arrival.",
    longStayRoutes: ["Freelance Visa (Freiberufler)", "Employment Visa", "Job Seeker Visa", "Student Visa"],
    license: "some_states",
    licenseNote: "Drivers license reciprocity is state-specific. Around 27 US states have full reciprocity (no exams), several have partial (theory exam only), and others have none.",
    keyNotes: ["Germany strictly taxes worldwide income for residents. FATCA causes German banks to avoid US clients or apply extensive tracking.", "US Social Security benefits paid to German residents are generally exempt from German tax if paid to a US citizen, but private 401(k)s are taxed.", "The Totalization Agreement exempts US employees temporarily transferred to Germany for 5 years or less from Rentenversicherung contributions."],
    officialUrl: "https://de.usembassy.gov/driving-in-germany-2/",
    officialLabel: "de.usembassy.gov",
  },
  "netherlands": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days (Schengen). They can apply for a residence permit locally in the Netherlands, including special pathways for self-employed entrepreneurs.",
    longStayRoutes: ["Dutch-American Friendship Treaty (DAFT) for entrepreneurs", "Highly Skilled Migrant Permit", "Student Permit"],
    license: "none",
    licenseNote: "There is no general drivers license reciprocity, except for expats who qualify for the 30% highly skilled migrant ruling. Otherwise, Americans must pass the Dutch theory and practical road tests.",
    keyNotes: ["The Dutch-American Friendship Treaty (DAFT) is a highly attractive route for self-employed US citizens, requiring a minimum capital investment of EUR 4,500.", "The Netherlands' Box 3 tax on deemed yield of savings and investments can heavily penalize US citizens who have significant savings or investments.", "FATCA causes major issues in the Netherlands; some banks refuse US citizens."],
  },
  "france": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days (Schengen). Long-term visas must be applied for at a French consulate in the US through the VFS Global portal prior to departure.",
    longStayRoutes: ["Talent Passport (Passeport Talent)", "Long-Stay Visitor Visa (VLS-TS)", "Digital Nomad / Entrepreneur Visa", "Student Visa"],
    license: "some_states",
    licenseNote: "Driver's license exchange is based on individual US state reciprocity. Currently, around 18 states (e.g., TX, FL, CO, PA, IL) allow direct exchange within 1 year.",
    keyNotes: ["Under Article 18 of the treaty, US Social Security pension payments are taxed only in the US, which is a major advantage for American retirees.", "France's wealth tax on real estate (IFI) applies to worldwide real property if the net value exceeds EUR 1.3 million.", "FATCA rules make opening bank accounts very slow; many French retail banks apply strict screening to US citizens."],
    officialUrl: "https://fr.usembassy.gov/u-s-citizen-services/local-resources-of-u-s-citizens/driving-in-france/",
    officialLabel: "fr.usembassy.gov",
  },
  "italy": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days (Schengen). For long-term stays, they must apply for an Elective Residency or work visa at an Italian consulate in the US prior to travel.",
    longStayRoutes: ["Elective Residency Visa (ERV)", "Digital Nomad Visa", "Self-Employed Visa", "Student Visa"],
    license: "none",
    licenseNote: "There is no driver's license reciprocity. US citizens can drive for up to 1 year on an IDP, but to continue driving they must pass full Italian driving exams (written and practical, in Italian).",
    keyNotes: ["Italy has a flat 7% tax scheme for foreign retirees who relocate to specific municipalities in Southern Italy (populations under 20,000) for up to 10 years.", "US citizens face major hurdles when opening bank accounts in Italy because of FATCA reporting requirements.", "Italy taxes worldwide assets (IVIE on real estate and IVAFE on financial assets) for tax residents, making holding US investments very complex."],
    officialUrl: "https://it.usembassy.gov/u-s-citizen-services/local-resources-of-u-s-citizens/transportation-driving/",
    officialLabel: "it.usembassy.gov",
  },
  "ireland": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Ireland visa-free for up to 90 days. For long-term residency, they must apply for a D-visa or register with immigration locally under specific circumstances.",
    longStayRoutes: ["Critical Skills Employment Permit", "Stamp 0 (for independent means)", "Student Visa"],
    license: "none",
    licenseNote: "There is no direct exchange reciprocity. US citizens can drive for up to 1 year as tourists, but to get an Irish license they must undergo reduced Essential Driver Training (6 lessons) and pass Irish test.",
    keyNotes: ["Ireland's remittance basis of taxation is a major benefit for non-domiciled expats: foreign-source income is not taxed in Ireland as long as it is not remitted.", "Opening bank accounts in Ireland is heavily affected by FATCA; banks require extensive residency documentation and US tax ID (TIN/SSN) numbers.", "Ireland imposes high tax rates on passive investments like ETFs (up to 41% tax and an 8-year deemed disposal rule), which is highly complex for US expats."],
  },
  "united-kingdom": {
    visaFreeDays: 180,
    howToApply: "US citizens can enter the UK visa-free for up to 180 days (6 months) as tourists. For long-term residency, visas must be applied for online from the US prior to departure.",
    longStayRoutes: ["Skilled Worker Visa", "Global Talent Visa", "Student Visa", "High Potential Individual (HPI) Visa"],
    license: "none",
    licenseNote: "No exchange reciprocity. US citizens can drive for up to 1 year on their US license, but then they must pass the UK theoretical and practical driving tests to obtain a British license.",
    keyNotes: ["The UK is transitioning away from the traditional 'non-domiciled' (non-dom) tax status to a residence-based regime (new rules effective 2025/2026), significantly impacting high-net-worth US expats.", "FATCA compliance is strict; UK banks will ask for a US SSN/TIN and report account balances directly to the IRS.", "The US-UK tax treaty contains excellent pension rules (Article 17 and 18), allowing tax-free transfers and recognizing the tax-deferred status of 401(k)s and Roth IRAs."],
    officialUrl: "https://www.gov.uk/exchange-foreign-driving-licence",
    officialLabel: "gov.uk",
  },
  "canada": {
    visaFreeDays: 180,
    howToApply: "US citizens can enter visa-free for up to 180 days. Long-term visa/work permits must be applied for online before entry or in some cases at the border.",
    longStayRoutes: ["Express Entry (Federal Skilled Worker)", "Provincial Nominee Program (PNP)", "Intra-Company Transfer (ICT)"],
    license: "full_reciprocity",
    licenseNote: "Reciprocity exists between all Canadian provinces and all US states, allowing direct swap of a valid US driver's license for a local provincial one without exams.",
    keyNotes: ["Canada taxes residents on worldwide income. The US-Canada tax treaty governs tax credits, ensuring taxes paid to Canada offset US liability via Form 1116.", "Canada recognizes the tax-deferred status of Roth IRAs and 401(k)s under the treaty, but specific elections and reporting must be made annually to ensure exemption.", "FBAR and FATCA reporting remain mandatory for Canadian bank and investment accounts (TFSA accounts are highly penalized under US tax rules)."],
  },
  "australia": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days as tourists, but must obtain an Electronic Travel Authority (ETA) before traveling. For long stays, apply online before departure.",
    longStayRoutes: ["Skilled Independent Visa (Subclass 189)", "Employer Nomination Scheme (Subclass 186)", "Student Visa"],
    license: "full_reciprocity",
    licenseNote: "Direct license exchange exists for US citizens who are 25 or older (or 21+ in some states) across all Australian states and territories, with no written or practical tests required.",
    keyNotes: ["Australia's superannuation (retirement) funds are highly complex under US tax law; they are often classified as foreign trusts, leading to heavy reporting burdens.", "Capital gains on the sale of a primary residence are subject to specific Australian rules, which may not completely align with the US Section 121 exclusion.", "FATCA compliance is strictly enforced by all major Australian banks."],
    officialUrl: "https://info.australia.gov.au/information-and-services/transport-and-regional/driving-with-an-overseas-licence",
    officialLabel: "info.australia.gov.au",
  },
  "estonia": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days (Schengen). Long-term visas (D-visa) can be applied for online and processed at an Estonian embassy, or directly in Estonia.",
    longStayRoutes: ["Digital Nomad Visa (DNV)", "Startup Visa", "Employment D-Visa"],
    license: "full_reciprocity",
    licenseNote: "US citizens who hold a residence permit can exchange their valid US license for an Estonian one without any driving exams, provided they submit a medical certificate.",
    keyNotes: ["Estonia does not have a Social Security Totalization Agreement with the US. Self-employed Americans in Estonia may be subject to dual social security contributions.", "Estonia's corporate tax system is unique: a flat 20% tax is levied only on distributed profits (dividends), while reinvested earnings are taxed at 0%.", "Opening bank accounts (e.g., LHV, Swedbank) as a US citizen is difficult due to FATCA; expect monthly 'foreign client' fees and extensive screenings."],
  },
  "poland": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days (Schengen). For stays exceeding 90 days, they must apply for a national D-visa at a Polish consulate in the US, or apply for a temporary residence permit (Karta pobytu) locally in Poland.",
    longStayRoutes: ["Temporary Residence and Work Permit (Jednolite zezwolenie)", "Business/Sole Proprietorship Permit", "Student Visa"],
    license: "none",
    licenseNote: "No exchange reciprocity. US citizens can drive for 6 months, after which they must exchange their license. Since US licenses do not strictly meet the Vienna Convention, exchange requires passing the Polish theoretical driving exam.",
    keyNotes: ["Poland's center of vital interests doctrine is strictly applied for tax residency. If family or property is retained in Poland, tax authorities will treat you as a worldwide tax resident.", "Under the 1974 treaty, private pension distributions to a Polish resident may be taxed by Poland, with credit given for US tax.", "Polish banks require rigorous screening and US SSN disclosure for FATCA compliance."],
    officialUrl: "https://www.gov.pl/web/gov/wymien-zagraniczne-prawo-jazdy-na-polskie",
    officialLabel: "gov.pl",
  },
  "japan": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Japan visa-free for up to 90 days. For long-term stays, they must obtain a Certificate of Eligibility (COE) and apply for a visa at a Japanese consulate in the US.",
    longStayRoutes: ["Highly Skilled Professional Visa", "Business Manager Visa", "Working Visa (various categories)", "Spouse of Japanese National Visa"],
    license: "some_states",
    licenseNote: "License reciprocity (exemption from written and practical exams under 'Gaimen Kirikae') applies to a growing list of US states, including MD, WA, HI, OH, VA, CO, and IN. Others must pass the tests.",
    keyNotes: ["Japan imposes a strict worldwide inheritance tax on long-term residents (holding a table-type visa or residing in Japan for over 10 of the past 15 years), capturing US assets.", "FATCA compliance is comprehensive; Japanese financial institutions require US taxpayers to submit self-certification forms.", "Under the US-Japan tax treaty, public pensions (like US Social Security) are taxed only in the country of residence (Japan), while private pensions are taxed in the source country under specific withholding caps."],
  },
  "singapore": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Singapore visa-free for up to 90 days. For long-term stays, visas (Employment Pass, EntrePass) must be sponsored by an employer and approved by MOM.",
    longStayRoutes: ["Employment Pass (EP)", "EntrePass (for entrepreneurs)", "Overseas Networks & Expertise (ONE) Pass"],
    license: "some_states",
    licenseNote: "US citizens can convert their license to a Singapore Class 3/3A license by passing only the local Basic Theory Test (BTT). No practical driving test is required.",
    keyNotes: ["Because there is no income tax treaty, US passive income (dividends, interest) is subject to full domestic tax in both countries without treaty-based reductions, relying solely on US FTC.", "Singapore has no Social Security Totalization agreement. US employees and employers may face dual contribution liabilities if working in Singapore under US employment contracts.", "The Central Provident Fund (CPF) in Singapore is a mandatory local pension; however, foreign expats (including US citizens) are generally exempt from contributing unless they obtain Permanent Residency."],
    officialUrl: "https://www.police.gov.sg/Advisories/Traffic/Traffic-Matters/Passing-the-Basic-Theory-Test",
    officialLabel: "police.gov.sg",
  },
  "greece": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days. For long-term residence, they must apply for a long-stay D-visa at a Greek consulate in the US, or utilize the Golden Visa program.",
    longStayRoutes: ["Golden Visa (Real Estate / Investment)", "Digital Nomad Visa (DNV)", "Financially Independent Person (FIP) Visa", "Student Visa"],
    license: "full_reciprocity",
    licenseNote: "Since late 2021, US citizens can drive in Greece on their valid US license without an IDP, and they can directly exchange their US license for a Greek one without exams.",
    keyNotes: ["Greece offers a highly attractive 7% flat tax rate for foreign pensioners who transfer their tax residency to Greece, valid for up to 15 years.", "FATCA is fully implemented; Greek banks require US taxpayers to sign a waiver of confidentiality and submit US tax forms.", "Greece has a Golden Visa program that allows US citizens to get permanent residency through real estate purchase, though the minimum investment thresholds have been recently raised (up to EUR 800,000 in popular areas)."],
    officialUrl: "https://gr.usembassy.gov/u-s-citizen-services/local-resources-of-u-s-citizens/driving-in-greece/",
    officialLabel: "gr.usembassy.gov",
  },
  "cyprus": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Cyprus visa-free for up to 90 days. For stays exceeding 90 days, they must apply for a temporary residence permit (Pink Slip) or a permanent residency permit.",
    longStayRoutes: ["Temporary Residence Permit (Pink Slip)", "Digital Nomad Visa", "Category F (Retirement / Independent Means)", "Permanent Residency by Investment"],
    license: "full_reciprocity",
    licenseNote: "US citizens can drive on their US license for up to 6 months. After 6 months of legal residency, they can directly exchange their US license for a Cypriot license without any exams.",
    keyNotes: ["Cyprus offers a highly attractive 'non-domicile' tax status, which exempts tax-resident foreigners from defense taxes on dividends, interest, and rental income for up to 17 years.", "Earning income as a US digital nomad in Cyprus is subject to local tax if tax residency is established, with no totalization agreement in place.", "FATCA is fully implemented; Cypriot banks are highly risk-averse and require extensive compliance documentation for US citizens."],
    officialUrl: "https://www.mcw.gov.cy/mcw/rtd/rtd.nsf/index_en/index_en",
    officialLabel: "mcw.gov.cy",
  },
  "malta": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Malta visa-free for up to 90 days (Schengen). For longer stays, they must apply for a national visa or residence permit through Identita Malta.",
    longStayRoutes: ["Nomad Residence Permit (NRP)", "Malta Permanent Residence Programme (MPRP)", "Work Permit (Key Employee Scheme)"],
    license: "none",
    licenseNote: "There is no driver's license reciprocity. US citizens can drive for up to 1 year as tourists, but to drive permanently, they must pass the Maltese theoretical and practical driving tests from scratch.",
    keyNotes: ["Malta's remittance basis of taxation is popular among non-domiciled residents, where foreign-source income is not taxed locally unless remitted to Malta.", "The US-Malta tax treaty was modified by a competent authority agreement in 2021 to limit the use of Malta personal pension schemes as tax-free retirement shelters for US taxpayers.", "There is no Social Security Totalization agreement, which can lead to double social security tax for self-employed expats."],
    officialUrl: "https://www.transport.gov.mt/land/driving/driving-licence/exchanging-your-driving-licence-915",
    officialLabel: "transport.gov.mt",
  },
  "switzerland": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days (Schengen). For long-term stays, they must secure a job or apply for cantonal authorization, which is highly restricted for non-EU nationals.",
    longStayRoutes: ["Employment Permit (subject to strict quotas)", "Retiree Permit (over 55 with Swiss ties)", "Student Visa"],
    license: "full_reciprocity",
    licenseNote: "US citizens can drive for up to 1 year. Within that year, they can exchange their US license for a Swiss one, but must pass a simplified 'control drive' (Kontrollfahrt), with no theoretical exam required.",
    keyNotes: ["Switzerland is famous for its 'lump-sum taxation' (Forfait) system, which is a negotiable annual tax based on living expenses rather than worldwide income, highly attractive for wealthy retirees.", "Opening a bank account in Switzerland as a US citizen is notoriously difficult. Many Swiss banks require high minimum deposits (often CHF 10,000 to CHF 100,000) or reject US citizens outright to avoid FATCA compliance issues.", "Under the tax treaty, Swiss Pillar 1 and Pillar 2 pensions receive specific treaty protections, but US citizens must carefully disclose Swiss pension accounts on FBAR and Form 8938."],
  },
  "austria": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days (Schengen). Settlement visa applications must be made at Austrian consulates in the US before departure.",
    longStayRoutes: ["Red-White-Red Card (Skilled Work)", "Settlement Permit (Gainful Employment Excepted)", "Student Visa"],
    license: "none",
    licenseNote: "No direct driver's license reciprocity. US citizens can drive for up to 6 months with an IDP, but to convert their license they must sit for a practical driving test.",
    keyNotes: ["Austria has a settlement permit called 'gainful employment excepted' designed for retirees or people of independent means, but it has extremely strict annual cantonal quotas.", "Austria's tax system applies a high capital gains tax (27.5%) on investments, which applies to worldwide income for tax residents.", "FATCA reporting makes Austrian banks highly conservative; US citizens must submit Form W-9 and face limited investment options."],
  },
  "czechia": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Czechia visa-free for up to 90 days (Schengen). Stays exceeding 90 days require applying for a long-term visa or residence permit at a Czech embassy in the US prior to travel.",
    longStayRoutes: ["Zivnostensky List (Zivno - Trade License Visa)", "Employee Card", "Business Visa", "Student Visa"],
    license: "none",
    licenseNote: "There is no general driver's license reciprocity. US citizens with a Czech residence permit must apply for an exchange within 3 months, which typically requires taking tests as US licenses do not strictly meet Vienna/Geneva convention standards.",
    keyNotes: ["The 'Zivno' trade license is a highly popular option for US digital nomads, allowing them to pay a lump-sum flat tax and social fee (Pausalni dan) to simplify local reporting.", "The US-Czechia Totalization Agreement prevents double social security taxation, ensuring self-employed or transferred workers pay into only one system.", "Czech banks enforce FATCA strictly; US expats must submit Form W-9 and some banks (e.g., CSOB, Ceska sporitelna) have specialized compliance teams."],
  },
  "georgia": {
    visaFreeDays: 360,
    howToApply: "US citizens can enter Georgia visa-free for up to 360 days (1 full year) and are legally permitted to work and run a business locally without a separate work permit during this period.",
    longStayRoutes: ["Individual Entrepreneur Registration", "Work Residence Permit", "Investment Residence Permit"],
    license: "full_reciprocity",
    licenseNote: "US citizens can directly convert their valid US driver's license to a Georgian license without passing any exams, requiring only a certified Georgian translation of their US license.",
    keyNotes: ["Georgia offers a highly lucrative 'Small Business' tax status, which levies a flat 1% income tax on revenues up to GEL 500,000 for registered individual entrepreneurs.", "There is no Totalization Agreement; self-employed Americans in Georgia are subject to US self-employment tax (15.3%) under SECA.", "US retirement distributions are taxed as foreign source income in Georgia; tax residents must declare worldwide income, although local source taxation rules may apply."],
    officialUrl: "https://sda.gov.ge/",
    officialLabel: "sda.gov.ge",
  },
  "armenia": {
    visaFreeDays: 180,
    howToApply: "US citizens can enter Armenia visa-free for up to 180 days per year. Stays over 180 days require applying for a residence card at the Passport and Visa Department in Yerevan.",
    longStayRoutes: ["Work Permit / Employment Residence Card", "Business Residence (for IT / entrepreneurs)", "Student Residence Card"],
    license: "none",
    licenseNote: "There is no direct driving license exchange reciprocity. Expatriates must pass the Armenian theoretical driving exam (available in English) to convert their US license.",
    keyNotes: ["Armenia offers micro-business tax exemptions and an IT startup certification program which can reduce local corporate tax rates to 0% and personal income tax to a flat 10% for employees.", "Since there is no Totalization Agreement, Americans working in Armenia under US contracts face double social security tax exposure.", "FATCA is strictly applied in Armenian banks; US taxpayers must provide a W-9 form and undergo additional compliance screening."],
  },
  "turkey": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Turkey visa-free for up to 90 days within any 180-day period (eVisa requirement was waived starting late Dec 2023). Stays exceeding 90 days require a residency permit.",
    longStayRoutes: ["Short-Term Residence Permit (Tourism / Real Estate)", "Work Permit (VITEM V)", "Student Residence Permit"],
    license: "full_reciprocity",
    licenseNote: "US citizens holding a Turkish residence permit can exchange their valid US driver's license for a Turkish license without exams, requiring a certified Turkish translation and a medical report.",
    keyNotes: ["There is no Social Security Totalization agreement. Expats working in Turkey must pay US self-employment tax or local social security depending on their employer structure.", "Turkey's tax authority (GIB) taxes tax residents on worldwide income. Double tax relief is managed via the US-Turkey tax treaty.", "Due to FATCA, Turkish banks require extensive disclosure forms (Form W-9) for US citizens and report balances to the Turkish Revenue Administration for onward exchange."],
    officialUrl: "https://www.nvi.gov.tr/",
    officialLabel: "nvi.gov.tr",
  },
  "brazil": {
    visaFreeDays: null,
    howToApply: "Visa required starting April 10, 2025. US citizens must apply for a visitor eVisa online before traveling for tourism. Long-term visas must be processed at a Brazilian consulate in the US.",
    longStayRoutes: ["VITEM V (Work Visa)", "VITEM XI (Family Reunification)", "VITEM XIV (Digital Nomad Visa)", "Investor Visa"],
    license: "full_reciprocity",
    licenseNote: "US citizens can drive for up to 180 days on their US license. For longer stays, they can register and exchange their US license for a Brazilian CNH after undergoing medical and psychological tests, without sitting driving exams.",
    keyNotes: ["Because there is no income tax treaty, US citizens face double taxation risk on passive income like dividends or capital gains, relying solely on unilateral Foreign Tax Credits.", "The US-Brazil Totalization Agreement prevents double social security taxation on earnings, assigning coverage and tax liability to only one country.", "Brazil taxes tax residents on worldwide income. Financial accounts and controlled foreign corporations (CFCs) must be reported under strict Brazilian reporting regimes; FATCA is fully active."],
    officialUrl: "https://www.gov.br/pt-br/servicos/obter-carteira-nacional-de-habilitacao-cnh",
    officialLabel: "gov.br",
  },
  "argentina": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Argentina visa-free for up to 90 days for tourism. For long-term stays, they must apply for residency directly at the National Directorate of Migration.",
    longStayRoutes: ["Rentista Visa (Passive Income)", "Digital Nomad Visa", "Jubilado (Retirement) Visa", "Work Visa"],
    license: "none",
    licenseNote: "There is no driving license exchange reciprocity. Expatriates can drive on a US license for up to 90 days but must pass standard written and practical driving tests in their local municipality to get an Argentine license.",
    keyNotes: ["Argentina has severe currency exchange controls (e.g., official exchange rate vs CEP/blue market), making direct bank transfers and conversions highly complex and costly for US citizens.", "Argentina imposes a worldwide wealth tax (Bienes Personales) on assets held by tax residents both inside and outside Argentina.", "Without an income tax treaty, double taxation must be managed purely via the US Foreign Tax Credit (Form 1116) and Foreign Earned Income Exclusion (Form 2555)."],
    officialUrl: "https://www.argentina.gob.ar/licencia",
    officialLabel: "argentina.gob.ar",
  },
  "uruguay": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Uruguay visa-free for up to 90 days. For long-term residency, they can apply directly while in Uruguay as a tourist, without having to return to the US.",
    longStayRoutes: ["Permanent Legal Residence (Residencia Permanente)", "Rentista Visa (Passive Income / Pension)"],
    license: "full_reciprocity",
    licenseNote: "US citizens who obtain residency can exchange their valid US driver's license for an equivalent Uruguayan license without passing driving exams, after undergoing a medical exam.",
    keyNotes: ["Uruguay offers a famous 'tax holiday' for new residents, allowing a choice between a 10-year 0% tax rate on foreign-source passive income (interest and dividends) or a flat 7% tax rate indefinitely.", "The US-Uruguay Totalization Agreement prevents double Social Security taxation, a major benefit for self-employed expats.", "Uruguayan banks require extensive paperwork and FATCA disclosures (W-9 forms) to open checking or savings accounts for US citizens."],
  },
  "costa-rica": {
    visaFreeDays: 180,
    howToApply: "US citizens can enter Costa Rica visa-free for up to 180 days (recently extended from 90 days). Stays exceeding this require applying for residency at the Directorate General of Migration.",
    longStayRoutes: ["Pensionado (Retiree Visa)", "Rentista (Passive Income Visa)", "Digital Nomad Visa (Estancia de Cooperación)"],
    license: "full_reciprocity",
    licenseNote: "US citizens can drive for up to 180 days. To obtain a Costa Rican license (homologación), residents can exchange it without exams, after obtaining a medical certificate.",
    keyNotes: ["Costa Rica has a territorial tax system, meaning foreign-source income (like US interest, dividends, and pensions) is 100% tax-exempt under local law.", "The Digital Nomad Visa offers a complete local income tax exemption for up to 2 years, but remote workers must still report worldwide income to the IRS.", "Opening bank accounts in Costa Rica requires rigorous paperwork to satisfy FATCA; accounts are easily frozen if annual updates are missed."],
  },
  "panama": {
    visaFreeDays: 180,
    howToApply: "US citizens can enter Panama visa-free for up to 180 days. For residency, applications are managed locally by a licensed attorney through the National Migration Service.",
    longStayRoutes: ["Pensionado Visa (Retirement Visa)", "Friendly Nations Visa", "Qualified Investor Visa"],
    license: "full_reciprocity",
    licenseNote: "US citizens can drive for 90 days. To convert to a Panamanian license (homologación), they can exchange it without exams after submitting a certified blood test and getting their US license authenticated by the consulate.",
    keyNotes: ["Panama has a territorial tax system, meaning all foreign-source income (including US pensions and remote work) is completely tax-free under Panamanian law.", "The Pensionado program is one of the most generous in the world, offering US retirees extensive discounts (10% to 50%) on medical services, dining, hotels, and utility bills.", "Panamanian banks are highly regulated under FATCA; US citizens must submit W-9 forms and undergo extensive compliance reviews before account activation."],
    officialUrl: "https://www.migracion.gob.pa/",
    officialLabel: "migracion.gob.pa",
  },
  "colombia": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Colombia visa-free for up to 90 days (extendable to 180 days per year). For stays over 180 days, they must apply for an online visa (Migrant or Resident).",
    longStayRoutes: ["Migrant (M) Pensionado Visa", "Migrant (M) Rentista Visa", "Visitor (V) Digital Nomad Visa"],
    license: "none",
    licenseNote: "No drivers license exchange reciprocity. Foreign licenses are valid for 180 days. To drive permanently, US citizens must apply for a new Colombian license and pass theoretical, practical, and medical tests.",
    keyNotes: ["Colombia taxes residents on worldwide income after 183 days of stay. US retirement accounts (401k, IRA) are not recognized as tax-deferred, and distributions are taxed under ordinary progressive rates up to 39%.", "No Totalization Agreement exists; self-employed US citizens in Colombia may owe US self-employment tax (15.3%) and face local Colombian mandatory social security/health contributions.", "Opening Colombian bank accounts is heavily restricted for US citizens due to FATCA; many institutions require physical office visits and extensive compliance checks."],
    officialUrl: "https://www.runt.gov.co/",
    officialLabel: "runt.gov.co",
  },
  "malaysia": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Malaysia visa-free for up to 90 days. Stays over 90 days require applying for residency or a specialized visa through government programs.",
    longStayRoutes: ["Malaysia My Second Home (MM2H) Visa", "DE Rantau Digital Nomad Pass", "Employment Pass (EP)"],
    license: "none",
    licenseNote: "Direct driver's license conversion was suspended in late 2018. To drive permanently, US citizens must go through local driving schools and pass Malaysian driving tests.",
    keyNotes: ["The MM2H program recently raised its minimum financial requirements, requiring significant offshore fixed deposits depending on the visa tier (Silver, Gold, or Platinum).", "Malaysia has a territorial tax system, but taxes foreign income remitted to Malaysia unless specific exemptions apply (which are subject to strict residency timelines).", "FATCA is strictly enforced; Malaysian banks require extensive disclosures and US taxpayers are reported directly to the IRS."],
    officialUrl: "https://www.jpj.gov.my/",
    officialLabel: "jpj.gov.my",
  },
  "indonesia": {
    visaFreeDays: null,
    howToApply: "Visa required. US citizens must secure a B1 e-VOA (Visa on Arrival) online before travel or purchase it at the airport for stays up to 30 days (extendable once to 60 days).",
    longStayRoutes: ["E33G Remote Worker Visa (KITAS)", "Investor KITAS", "Retirement KITAS"],
    license: "none",
    licenseNote: "There is no driver's license exchange reciprocity. To drive, US citizens must hold an IDP or apply for a local Indonesian SIM license at a local police station (Polres) and pass physical and driving exams.",
    keyNotes: ["The E33G Remote Worker Visa (new in 2024) allows digital nomads to live in Bali and work remotely for up to 1 year, provided they earn at least $60,000/year from offshore employers.", "Indonesia taxes residents on worldwide income after 183 days of residency. US retirement distributions are taxed as foreign source income.", "FATCA is fully implemented; Indonesian banks require extensive compliance documentation and tax certifications for US citizens."],
  },
  "vietnam": {
    visaFreeDays: null,
    howToApply: "Visa required. US citizens must apply for a 90-day e-visa online prior to travel. For longer stays, they require temporary residence cards (TRC) sponsored by an employer.",
    longStayRoutes: ["Work Visa (LD) & Temporary Residence Card (TRC)", "Investor Visa (DT)", "Business Visa (DN)"],
    license: "full_reciprocity",
    licenseNote: "US driver's licenses can be translated and converted to a local Vietnamese license without taking theoretical or practical exams, provided the applicant holds a residency visa of 3+ months.",
    keyNotes: ["With no active tax treaty, double taxation on passive income must be managed purely via the Foreign Tax Credit (Form 1116) and Foreign Earned Income Exclusion (Form 2555).", "Vietnam taxes tax residents on worldwide income after 183 days of residency. Self-employed Americans pay full US self-employment taxes with no totalization agreement.", "FATCA is strictly applied in Vietnam; local banks require extensive paperwork and tax ID disclosures for US citizens to open accounts."],
    officialUrl: "https://evisa.xuatnhapcanh.gov.vn/",
    officialLabel: "evisa.xuatnhapcanh.gov.vn",
  },
  "new-zealand": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days for tourism, but must obtain an NZeTA online before travel. Stays over 90 days require applying for a residency or work visa online.",
    longStayRoutes: ["Accredited Employer Work Visa (AEWV)", "Skilled Migrant Category Residence Visa", "Straight to Residence Visa"],
    license: "full_reciprocity",
    licenseNote: "US citizens can drive for up to 12 months. If they have held their valid US license for over 2 years, they can convert it to a New Zealand license without sitting a practical or theoretical test.",
    keyNotes: ["New Zealand offers transitional residency rules giving new residents a 4-year tax exemption on foreign-source passive income (like US dividends, interest, or rental income).", "The US-NZ tax treaty allows US taxes to be credited against NZ tax liability, but retirement accounts must be structured carefully to avoid foreign trust tax categorization under NZ law.", "FATCA is fully implemented; NZ banks require immediate disclosure of US tax residency and SSN/TIN."],
    officialUrl: "https://www.nzta.govt.nz/driver-licences/getting-a-licence/converting-a-foreign-driver-licence/",
    officialLabel: "nzta.govt.nz",
  },
  "philippines": {
    visaFreeDays: 30,
    howToApply: "US citizens can enter the Philippines visa-free for up to 30 days for tourism. For longer stays, they can extend their tourist visa locally or apply for a residency visa.",
    longStayRoutes: ["SRRV (Special Resident Retiree's Visa)", "SIRV (Investor Visa)", "13(a) Non-Quota Immigrant Visa (Marriage Visa)"],
    license: "full_reciprocity",
    licenseNote: "US citizens can drive for 90 days. To convert to a Philippine license, they can exchange it at the Land Transportation Office (LTO) without exams, after presenting a medical certificate.",
    keyNotes: ["The SRRV is highly popular among US retirees, requiring a deposit in a local bank of $10,000 to $20,000, which is protected and can be used for real estate investment.", "The Philippines has a territorial tax system for foreigners, meaning they are only taxed on income earned inside the Philippines (US investments and pensions are tax-exempt locally).", "FATCA is strictly applied; Philippine banks require W-9 forms and report US citizen accounts directly to the IRS."],
    officialUrl: "https://lto.gov.ph/",
    officialLabel: "lto.gov.ph",
  },
  "south-korea": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days. Long-term residency visas must be processed and applied for at a South Korean consulate in the US prior to departure.",
    longStayRoutes: ["F-2-7 (Points-Based Resident Visa)", "E-7 (Foreign National of Ability Visa)", "D-8 (Corporate Investor Visa)"],
    license: "some_states",
    licenseNote: "Reciprocity is state-specific. Around 23 US states (e.g., TX, FL, OR) have agreements allowing direct exchange of a US license for a Korean license after a physical check-up. Others must pass the written exam.",
    keyNotes: ["South Korea has strict asset reporting rules. Residents must file a report on foreign financial accounts to the National Tax Service if the value exceeds KRW 500 million.", "The US-Korea Totalization Agreement prevents double social security taxation, allowing self-employed expats to pay only into the US SECA system.", "FATCA is fully implemented; Korean banks require extensive disclosure forms from US citizens."],
  },
  "india": {
    visaFreeDays: null,
    howToApply: "Visa required. US citizens must secure an e-visa or regular paper visa online prior to travel. Stays over 180 days require registration with the FRRO locally.",
    longStayRoutes: ["Employment Visa", "Business Visa", "Entry (X) Visa (for persons of Indian origin / spouses)"],
    license: "none",
    licenseNote: "There is no driver's license reciprocity. To drive permanently, US citizens must apply for a new Indian learner's license and pass both theoretical and practical driving tests at a local RTO office.",
    keyNotes: ["India has no Totalization Agreement; self-employed Americans pay full US self-employment tax and face local Indian social taxes under certain corporate structures.", "India has a 'Resident but Not Ordinarily Resident' (RNOR) tax category that exempts foreign-source income from Indian tax for the first 2-3 years after moving to India.", "FATCA is strictly applied; Indian financial institutions are highly automated and require detailed US tax ID confirmations (W-9) to open accounts."],
    officialUrl: "https://sarathi.parivahan.gov.in/",
    officialLabel: "sarathi.parivahan.gov.in",
  },
  "south-africa": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter South Africa visa-free for up to 90 days. For longer stays, residency visa applications must be made at a South African embassy/consulate in the US before departure.",
    longStayRoutes: ["Retired Person Visa", "Critical Skills Work Visa", "Business Visa"],
    license: "full_reciprocity",
    licenseNote: "US citizens can drive on a US license with an IDP. Within 1 year of obtaining residency, they can convert their US license to a South African driver's license without passing driving exams, with a medical certificate.",
    keyNotes: ["No Totalization Agreement exists; self-employed Americans in South Africa pay full US self-employment tax (15.3%) and face local social security contributions.", "South Africa taxes residents on worldwide income. The US-South Africa tax treaty allows double taxation relief, but South Africa's strict exchange controls and financial emigration rules apply to tax residents.", "FATCA is fully implemented; South African banks are highly compliant and require US tax ID verification to prevent tax evasion."],
    officialUrl: "https://www.gov.za/services/services-residents/driving/convert-foreign-driving-licence",
    officialLabel: "gov.za",
  },
  "croatia": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Croatia visa-free for up to 90 days (Schengen). Stays over 90 days require applying for a temporary stay permit (Nomad or work) at a consulate in the US or locally.",
    longStayRoutes: ["Digital Nomad Residence (up to 1 year)", "Work and Residence Permit", "Settlement Permit"],
    license: "full_reciprocity",
    licenseNote: "Croatia allows direct exchange of a valid US driver's license within 1 year of obtaining residency without sitting exams, requiring a medical certificate and a certified translation.",
    keyNotes: ["Because the tax treaty is not yet in force, double taxation must be managed purely via the Foreign Tax Credit (Form 1116) and Foreign Earned Income Exclusion (Form 2555).", "No Totalization Agreement exists; digital nomads or self-employed expats are subject to US self-employment taxes (15.3%) and may face local Croatian health/pension contributions if not covered by a specialized visa exemption.", "FATCA is fully implemented; Croatian banks require a US tax ID (TIN/SSN) to open checking or savings accounts."],
    officialUrl: "https://mup.gov.hr/en",
    officialLabel: "mup.gov.hr",
  },
  "sweden": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter Sweden visa-free for up to 90 days (Schengen). Stays over 90 days require applying for a residence permit online before entering Sweden.",
    longStayRoutes: ["Work Permit", "Co-applicant/Sambo (Family Reunification) Permit", "Student Visa"],
    license: "none",
    licenseNote: "There is no direct exchange reciprocity. Sweden permits driving on a US license for up to 1 year. After 1 year, Americans must go through the entire driving license process in Sweden (theory, practical, risk training).",
    keyNotes: ["Sweden taxes residents on worldwide income. The US-Sweden tax treaty provides double tax relief, but Swedish tax-favorable investment accounts (ISK) are highly penalized under US PFIC rules.", "The US-Sweden Totalization Agreement prevents double social security taxation, ensuring self-employed or transferred workers pay into only one system.", "FATCA is strictly applied; Swedish banks require immediate disclosure of US citizenship and report account balances directly to the IRS."],
  },
  "belgium": {
    visaFreeDays: 90,
    howToApply: "US citizens can enter visa-free for up to 90 days (Schengen). Long-term visas must be requested at a Belgian consulate in the US before traveling.",
    longStayRoutes: ["Single Permit (Work)", "Professional Card (self-employed)", "Student Visa"],
    license: "some_states",
    licenseNote: "Reciprocity varies by US state. Belgium recognizes certain US state licenses for direct exchange, but the rules are highly technical and depend on the specific state and when the license was issued.",
    keyNotes: ["Belgium has very high personal income tax rates (up to 50% on income over EUR 46,000), but does not tax capital gains on shares if held under normal 'prudent manager' conditions.", "FATCA makes opening retail bank accounts in Belgium slow; US citizens are subjected to rigorous identity and financial tracking.", "The Totalization Agreement protects self-employed Americans and detached employees from paying double social security contributions."],
  },
};

export function usCountryDetailForSlug(slug: string): UsCountryDetail | null {
  return US_COUNTRY_DETAIL[slug] ?? null;
}
