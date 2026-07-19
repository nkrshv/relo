// Hague Apostille Convention (HCCH 1961) membership per country, and the
// computed document-legalization path for an origin -> destination pair.
//
// Why this exists: whether a document needs an Apostille or full consular
// legalization depends on BOTH countries' convention status. The model's
// training data is stale here (countries join every year), and a wrong
// verdict is one of the most expensive mistakes a mover can act on. So the
// verdict is computed from this table and injected into the prompt as ground
// truth instead of being left to the model.
//
// The verdict is deliberately phrased as "likely": the convention covers
// public documents in general, but the receiving authority decides what it
// accepts for a specific document type and purpose (plus translation rules),
// so the user is always told to confirm with the receiving authority.
//
// Source: HCCH status table for the Apostille Convention
// (https://www.hcch.net/en/instruments/conventions/status-table/?cid=41).
// Keyed by lowercased country name; lookups normalize aliases via
// normalizeName(). "pendingEffective" marks a country that has acceded but
// where the convention is not yet in force (e.g. Thailand: 2027-02-28).

import { normalizeName } from "./countryFacts";

export interface HagueStatus {
  member: boolean;
  /** ISO date when the convention enters into force, for recent/pending joiners. */
  effectiveDate?: string;
  /** Set when the country acceded but the convention is not in force yet. */
  pendingEffective?: string;
  /** Special-case caveat (e.g. Taiwan is outside the convention system). */
  note?: string;
}

const VERIFIED = "2026-07";

const MEMBERS: string[] = [
  "albania",
  "andorra",
  "argentina",
  "armenia",
  "australia",
  "austria",
  "azerbaijan",
  "bahamas",
  "bahrain",
  "barbados",
  "belarus",
  "belgium",
  "belize",
  "bolivia",
  "bosnia and herzegovina",
  "botswana",
  "brazil",
  "brunei",
  "bulgaria",
  "burundi",
  "cape verde",
  "chile",
  "colombia",
  "costa rica",
  "croatia",
  "cyprus",
  "czechia",
  "denmark",
  "dominican republic",
  "ecuador",
  "el salvador",
  "estonia",
  "fiji",
  "finland",
  "france",
  "georgia",
  "germany",
  "greece",
  "guatemala",
  "honduras",
  "hong kong",
  "hungary",
  "iceland",
  "india",
  "ireland",
  "israel",
  "italy",
  "japan",
  "kazakhstan",
  "kyrgyzstan",
  "latvia",
  "liechtenstein",
  "lithuania",
  "luxembourg",
  "macau",
  "malta",
  "mauritius",
  "mexico",
  "moldova",
  "monaco",
  "mongolia",
  "montenegro",
  "morocco",
  "namibia",
  "netherlands",
  "new zealand",
  "nicaragua",
  "north macedonia",
  "norway",
  "oman",
  "panama",
  "paraguay",
  "peru",
  "philippines",
  "poland",
  "portugal",
  "romania",
  "russia",
  "serbia",
  "slovakia",
  "slovenia",
  "south africa",
  "south korea",
  "spain",
  "sweden",
  "switzerland",
  "tunisia",
  "turkey",
  "ukraine",
  "united kingdom",
  "united states",
  "uruguay",
  "uzbekistan",
  "venezuela",
];

// Known NON-members among the countries offered in the form. Kept explicit
// so an unknown/misspelled country falls through to "confirmation_required"
// instead of silently getting the consular verdict.
const NON_MEMBERS: string[] = [
  "afghanistan",
  "algeria",
  "angola",
  "benin",
  "bhutan",
  "burkina faso",
  "cambodia",
  "cameroon",
  "chad",
  "cuba",
  "egypt",
  "ethiopia",
  "ghana",
  "iran",
  "iraq",
  "ivory coast",
  "jordan",
  "kenya",
  "kuwait",
  "laos",
  "lebanon",
  "libya",
  "madagascar",
  "malaysia",
  "maldives",
  "mozambique",
  "myanmar",
  "nepal",
  "nigeria",
  "qatar",
  "sri lanka",
  "tanzania",
  "uganda",
  "united arab emirates",
  "vietnam",
  "zambia",
  "zimbabwe",
];

// Recent joiners where the in-force date matters for advice, and countries
// with special status. Countries missing from all three lists resolve to
// null and get the "confirmation_required" verdict.
const OVERRIDES: Record<string, HagueStatus> = {
  china: {
    member: true,
    effectiveDate: "2023-11-07",
    note: "Hong Kong and Macau have applied the convention since before 1997/1999, separately from the mainland.",
  },
  canada: { member: true, effectiveDate: "2024-01-11" },
  pakistan: { member: true, effectiveDate: "2023-03-09" },
  rwanda: { member: true, effectiveDate: "2024-06-05" },
  "saudi arabia": { member: true, effectiveDate: "2022-12-07" },
  indonesia: { member: true, effectiveDate: "2022-06-04" },
  singapore: { member: true, effectiveDate: "2021-09-16" },
  jamaica: { member: true, effectiveDate: "2021-07-03" },
  senegal: { member: true, effectiveDate: "2023-08-23" },
  bangladesh: { member: true, effectiveDate: "2025-03-30" },
  thailand: {
    member: false,
    pendingEffective: "2027-02-28",
    note: "Thailand has acceded; the convention enters into force on 2027-02-28. Until then documents need consular legalization.",
  },
  taiwan: {
    member: false,
    note: "Taiwan is outside the HCCH system entirely: documents are authenticated by its Ministry of Foreign Affairs and the destination's representative office, not by apostille or regular consular legalization.",
  },
};

const STATUS: Record<string, HagueStatus> = {
  ...Object.fromEntries(MEMBERS.map((c) => [c, { member: true }])),
  ...Object.fromEntries(NON_MEMBERS.map((c) => [c, { member: false }])),
  ...OVERRIDES,
};

export function hagueStatusFor(country: string): HagueStatus | null {
  return STATUS[normalizeName(country)] ?? null;
}

export type LegalizationVerdict =
  | "apostille_likely"
  | "consular_legalization_likely"
  | "confirmation_required";

export interface LegalizationPath {
  verdict: LegalizationVerdict;
  /** Ready-to-inject prompt lines describing the computed rule for this pair. */
  lines: string[];
  verified: string;
}

/**
 * Computed legalization path for documents ISSUED in `origin` that must be
 * ACCEPTED in `destination`. Apostilles can only be issued by the issuing
 * country, so the verdict depends on both sides' membership.
 */
export function legalizationPath(
  origin: string,
  destination: string,
): LegalizationPath {
  const o = hagueStatusFor(origin);
  const d = hagueStatusFor(destination);
  const lines: string[] = [];

  const note = (s?: HagueStatus) => (s?.note ? ` (${s.note})` : "");

  if (!o || !d) {
    return {
      verdict: "confirmation_required",
      lines: [
        `Hague Apostille status could not be resolved for this pair; instruct the user to confirm the legalization route (apostille vs consular legalization) with the receiving authority in ${destination} and the foreign ministry of ${origin}.`,
      ],
      verified: VERIFIED,
    };
  }

  if (o.member && d.member) {
    lines.push(
      `Both ${origin} and ${destination} are parties to the Hague Apostille Convention, so an APOSTILLE issued by the competent authority in ${origin} is the likely route for public documents (birth/marriage certificates, diplomas, criminal-record checks).${note(o)}${note(d)}`,
      `Never describe full consular legalization as required for this pair. Still tell the user to confirm the exact document list, translation requirements and any document age limits with the receiving authority in ${destination}.`,
    );
    if (d.effectiveDate)
      lines.push(
        `${destination} joined recently (in force since ${d.effectiveDate}); some local offices may still ask for the old consular chain, so keep receipts and point to the convention if challenged.`,
      );
    return { verdict: "apostille_likely", lines, verified: VERIFIED };
  }

  const nonMember = !d.member ? destination : origin;
  const nonMemberStatus = !d.member ? d : o;
  lines.push(
    `${nonMember} is NOT a party to the Hague Apostille Convention, so an apostille alone is NOT accepted for this route. The likely route is CONSULAR LEGALIZATION: authenticate the document in the issuing country (${origin}), then legalize it at ${destination}'s embassy or consulate in ${origin}, before departure.${note(nonMemberStatus)}`,
    `Never present a plain apostille as sufficient for this pair. Tell the user to confirm the exact chain (notarization, foreign ministry authentication, embassy legalization, sworn translation) with the receiving authority in ${destination}.`,
  );
  if (nonMemberStatus.pendingEffective)
    lines.push(
      `${nonMember} has acceded to the convention with effect from ${nonMemberStatus.pendingEffective}: documents legalized before that date need the consular chain; from that date an apostille should suffice. Base advice on the user's actual timeline.`,
    );
  return {
    verdict: "consular_legalization_likely",
    lines,
    verified: VERIFIED,
  };
}
