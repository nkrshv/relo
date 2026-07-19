// Pre-arrival requirements per destination: things a traveller must submit
// or obtain ONLINE BEFORE boarding/arrival that are neither a visa nor part
// of the residence process. Kept separate from the visa matrix because they
// have a different trigger (booking a flight), a submission window, and in
// some cases apply to ALL foreign arrivals regardless of visa status.
//
// Two distinct kinds that must never be conflated in the plan:
// - arrival_declaration: a mandatory registration for (almost) every foreign
//   arrival, e.g. Thailand's TDAC or Singapore's SG Arrival Card. Missing it
//   can mean being refused boarding or long delays at the border.
// - travel_authorization / visa_waiver_authorization: permission to board for
//   visa-exempt nationalities only (UK ETA, US ESTA, Canada eTA, K-ETA...).
//   Whether the user needs one depends on their passport, which the visa
//   verdict in the prompt already covers; the entry here supplies the real
//   system name, official URL and timing.
//
// Keyed by lowercased destination name; lookups normalize aliases via
// normalizeName(). Only confident, verified entries: an absent country means
// "no known pre-arrival requirement in this table", not "none exists".

import { normalizeName } from "./countryFacts";

export type PreArrivalType =
  | "arrival_declaration"
  | "travel_authorization"
  | "visa_waiver_authorization";

export interface PreArrivalRequirement {
  type: PreArrivalType;
  /** Official system name, e.g. "Thailand Digital Arrival Card (TDAC)". */
  name: string;
  officialUrl: string;
  /** Who must submit it. */
  appliesTo: "all_foreign_arrivals" | "visa_exempt_nationalities";
  /** Human description of the submission window, e.g. "within 72 hours before arrival". */
  submitWindow: string;
  /** When we last verified this entry, YYYY-MM. */
  verified: string;
  note?: string;
}

const V = "2026-07";

const REQUIREMENTS: Record<string, PreArrivalRequirement[]> = {
  thailand: [
    {
      type: "arrival_declaration",
      name: "Thailand Digital Arrival Card (TDAC)",
      officialUrl: "https://tdac.immigration.go.th/",
      appliesTo: "all_foreign_arrivals",
      submitWindow: "within 72 hours before arrival",
      verified: V,
      note: "Replaced the paper TM6 card; required for air, land and sea arrivals.",
    },
  ],
  singapore: [
    {
      type: "arrival_declaration",
      name: "SG Arrival Card (electronic health & arrival declaration)",
      officialUrl: "https://eservices.ica.gov.sg/sgarrivalcard/",
      appliesTo: "all_foreign_arrivals",
      submitWindow: "within 3 days before arrival",
      verified: V,
    },
  ],
  cambodia: [
    {
      type: "arrival_declaration",
      name: "Cambodia e-Arrival Card (CeA)",
      officialUrl: "https://arrival.gov.kh/",
      appliesTo: "all_foreign_arrivals",
      submitWindow: "within 7 days before arrival",
      verified: V,
    },
  ],
  "united kingdom": [
    {
      type: "travel_authorization",
      name: "UK Electronic Travel Authorisation (ETA)",
      officialUrl: "https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta",
      appliesTo: "visa_exempt_nationalities",
      submitWindow: "apply at least 3 working days before travel",
      verified: V,
      note: "Required for visa-exempt visitors; those coming on a visa or with UK immigration status do not need it.",
    },
  ],
  "united states": [
    {
      type: "visa_waiver_authorization",
      name: "ESTA (Visa Waiver Program authorization)",
      officialUrl: "https://esta.cbp.dhs.gov/",
      appliesTo: "visa_exempt_nationalities",
      submitWindow: "apply at least 72 hours before departure",
      verified: V,
      note: "Only for Visa Waiver Program nationalities entering as visitors; anyone moving on a work/student/immigrant visa uses that visa instead.",
    },
  ],
  canada: [
    {
      type: "travel_authorization",
      name: "Canada Electronic Travel Authorization (eTA)",
      officialUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html",
      appliesTo: "visa_exempt_nationalities",
      submitWindow: "usually approved within minutes, apply before booking",
      verified: V,
      note: "Applies to visa-exempt air arrivals only.",
    },
  ],
  "new zealand": [
    {
      type: "travel_authorization",
      name: "NZeTA (plus the IVL levy)",
      officialUrl: "https://nzeta.immigration.govt.nz/",
      appliesTo: "visa_exempt_nationalities",
      submitWindow: "allow up to 72 hours for processing",
      verified: V,
    },
  ],
  "south korea": [
    {
      type: "travel_authorization",
      name: "K-ETA (Korea Electronic Travel Authorization)",
      officialUrl: "https://www.k-eta.go.kr/",
      appliesTo: "visa_exempt_nationalities",
      submitWindow: "apply at least 72 hours before boarding",
      verified: V,
      note: "Some nationalities have temporary K-ETA exemptions; have the user check the current exemption list on the official site.",
    },
  ],
  australia: [
    {
      type: "travel_authorization",
      name: "Australian ETA (subclass 601) / eVisitor (subclass 651)",
      officialUrl: "https://immi.homeaffairs.gov.au/",
      appliesTo: "visa_exempt_nationalities",
      submitWindow: "usually processed within days, apply before booking",
      verified: V,
      note: "Visitor products only; anyone relocating applies for the appropriate substantive visa instead.",
    },
  ],
  israel: [
    {
      type: "travel_authorization",
      name: "ETA-IL (Electronic Travel Authorization)",
      officialUrl: "https://israel-entry.piba.gov.il/",
      appliesTo: "visa_exempt_nationalities",
      submitWindow: "apply at least 72 hours before travel",
      verified: V,
    },
  ],
  kenya: [
    {
      type: "travel_authorization",
      name: "Kenya Electronic Travel Authorisation (eTA)",
      officialUrl: "https://www.etakenya.go.ke/",
      appliesTo: "all_foreign_arrivals",
      submitWindow: "apply at least 72 hours before travel",
      verified: V,
      note: "Kenya abolished visas in favour of a universal eTA for most nationalities.",
    },
  ],
  "sri lanka": [
    {
      type: "travel_authorization",
      name: "Sri Lanka Electronic Travel Authorization (ETA)",
      officialUrl: "https://eta.gov.lk/",
      appliesTo: "all_foreign_arrivals",
      submitWindow: "apply before departure; processing is usually same-day",
      verified: V,
    },
  ],
};

export function preArrivalForCountry(
  country: string,
): PreArrivalRequirement[] | null {
  return REQUIREMENTS[normalizeName(country)] ?? null;
}
