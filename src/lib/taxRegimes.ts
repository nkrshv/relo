// Hand-curated special tax / residency regimes for movers, per country.
//
// Every entry carries a source URL and a "verified" date so the UI can show
// where a claim comes from and how fresh it is. Rules in this space change
// often (Portugal's NHR closed in 2024, the UK non-dom regime ended in 2025,
// Greece raised its golden-visa thresholds in 2024), so figures are phrased
// as approximate and the reader is always pointed at the source.
//
// Keyed by the lowercased country name; lookups normalize aliases via
// normalizeName().

import { normalizeName } from "./countryFacts";

export interface TaxRegime {
  /** Official or common name, e.g. "IFICI (ex-NHR)" or "Beckham regime". */
  name: string;
  /** One-line benefit, e.g. "20% flat tax on eligible income · 10 years". */
  headline: string;
  /** Who it's for and the key condition, one sentence. */
  detail: string;
  /** active = open to new applicants; changed = replaced/reworked recently; closed = no longer available. */
  status: "active" | "changed" | "closed";
  /** Shown when status is "changed"/"closed", e.g. what replaced it. */
  statusNote?: string;
  /** Official or authoritative source for the claim. */
  sourceUrl: string;
  sourceLabel: string;
  /** When we last verified this entry, YYYY-MM. */
  verified: string;
}

const V = "2026-06";

export const TAX_REGIMES: Record<string, TaxRegime[]> = {
  portugal: [
    {
      name: "IFICI (\u201cNHR 2.0\u201d)",
      headline: "20% flat tax on eligible Portuguese income · 10 years",
      detail:
        "Only for a list of high-value professions (research, tech, certified startups); the original NHR closed to new applicants at the end of 2023.",
      status: "changed",
      statusNote: "Replaced the NHR, which is closed to new applicants",
      sourceUrl: "https://www.portaldasfinancas.gov.pt/",
      sourceLabel: "Portal das Finan\u00e7as",
      verified: V,
    },
  ],
  spain: [
    {
      name: "Beckham regime",
      headline: "24% flat tax on Spanish employment income up to ~\u20ac600k · 6 years",
      detail:
        "For people who move to Spain for work (including digital-nomad-visa holders); apply within 6 months of registering with social security.",
      status: "active",
      sourceUrl: "https://sede.agenciatributaria.gob.es/",
      sourceLabel: "Agencia Tributaria",
      verified: V,
    },
  ],
  italy: [
    {
      name: "Inbound workers regime (impatriati)",
      headline: "50% of employment income tax-exempt up to ~\u20ac600k · 5 years",
      detail:
        "For new tax residents who worked abroad for the previous 3 years; the pre-2024 70\u201390% exemption was cut by the 2024 reform.",
      status: "changed",
      statusNote: "Scaled back in 2024 (was up to 70\u201390% exempt)",
      sourceUrl: "https://www.agenziaentrate.gov.it/",
      sourceLabel: "Agenzia delle Entrate",
      verified: V,
    },
    {
      name: "7% flat tax for foreign pensioners",
      headline: "7% flat tax on all foreign income · up to 10 years",
      detail:
        "Only when settling in a southern-Italy municipality with under 20,000 residents; requires a foreign pension.",
      status: "active",
      sourceUrl: "https://www.agenziaentrate.gov.it/",
      sourceLabel: "Agenzia delle Entrate",
      verified: V,
    },
  ],
  greece: [
    {
      name: "7% flat tax for foreign pensioners",
      headline: "7% flat tax on all foreign income · 15 years",
      detail:
        "For foreign pensioners moving their tax residence to Greece from a cooperating country.",
      status: "active",
      sourceUrl: "https://www.aade.gr/",
      sourceLabel: "AADE (tax authority)",
      verified: V,
    },
    {
      name: "50% inbound-worker exemption",
      headline: "Half of Greek employment income tax-free · 7 years",
      detail:
        "For workers and self-employed who move their tax residence to Greece to work there.",
      status: "active",
      sourceUrl: "https://www.aade.gr/",
      sourceLabel: "AADE (tax authority)",
      verified: V,
    },
  ],
  malta: [
    {
      name: "Non-dom (remittance basis)",
      headline: "Foreign income not remitted to Malta is untaxed",
      detail:
        "Residents without Maltese domicile pay tax only on Malta-source income and foreign income they bring in; a minimum annual tax may apply.",
      status: "active",
      sourceUrl: "https://cfr.gov.mt/",
      sourceLabel: "CFR (tax authority)",
      verified: V,
    },
  ],
  cyprus: [
    {
      name: "Non-dom regime",
      headline: "No tax on dividends & interest · 17 years",
      detail:
        "New tax residents without Cypriot domicile are exempt from the Special Defence Contribution on dividends and interest; 60-day residence rule available.",
      status: "active",
      sourceUrl: "https://www.mof.gov.cy/",
      sourceLabel: "Ministry of Finance",
      verified: V,
    },
    {
      name: "50% high-earner exemption",
      headline: "Half of employment income tax-free above ~\u20ac55k · 17 years",
      detail: "For first employment in Cyprus after at least 15 years abroad.",
      status: "active",
      sourceUrl: "https://www.mof.gov.cy/",
      sourceLabel: "Ministry of Finance",
      verified: V,
    },
  ],
  estonia: [
    {
      name: "No special expat regime",
      headline: "Flat ~22% personal income tax for everyone",
      detail:
        "No inbound tax break, but companies pay 0% on retained profits and e-Residency simplifies running an Estonian company (it is NOT a residence permit).",
      status: "active",
      sourceUrl: "https://www.emta.ee/",
      sourceLabel: "EMTA (tax authority)",
      verified: V,
    },
  ],
  andorra: [
    {
      name: "Standard low-tax system",
      headline: "Personal income tax capped at 10%",
      detail:
        "No special expat regime needed: income tax tops out at 10%, with no wealth or inheritance tax; passive residence requires a significant deposit/investment.",
      status: "active",
      sourceUrl: "https://www.govern.ad/",
      sourceLabel: "Govern d'Andorra",
      verified: V,
    },
  ],
  singapore: [
    {
      name: "Territorial-leaning system",
      headline: "No capital gains tax · top income rate 24%",
      detail:
        "Most foreign-source income of individuals is not taxed in Singapore; there is no special inbound regime (the old NOR scheme has lapsed).",
      status: "active",
      sourceUrl: "https://www.iras.gov.sg/",
      sourceLabel: "IRAS",
      verified: V,
    },
  ],
  "united arab emirates": [
    {
      name: "No personal income tax",
      headline: "0% tax on salaries and personal income",
      detail:
        "Individuals pay no income tax; a 9% corporate tax applies to business profits above ~AED 375k since 2023. Watch your tax residency in the country you leave.",
      status: "active",
      sourceUrl: "https://tax.gov.ae/",
      sourceLabel: "Federal Tax Authority",
      verified: V,
    },
  ],
  thailand: [
    {
      name: "Remittance-based taxation (tightened)",
      headline: "Foreign income is taxed when remitted to Thailand",
      detail:
        "Since 2024, foreign income brought into Thailand by tax residents is taxable regardless of the year it was earned; the LTR visa can exempt foreign income for qualifying categories.",
      status: "changed",
      statusNote: "The old \u201cremit next year tax-free\u201d loophole closed in 2024",
      sourceUrl: "https://www.rd.go.th/",
      sourceLabel: "Revenue Department",
      verified: V,
    },
  ],
  malaysia: [
    {
      name: "Territorial taxation",
      headline: "Foreign-source income largely untaxed for individuals",
      detail:
        "Individuals are generally taxed on Malaysian-source income only (a temporary exemption regime covers most remitted foreign income); the MM2H residence program was reworked in 2024 with much higher deposits.",
      status: "active",
      sourceUrl: "https://www.hasil.gov.my/",
      sourceLabel: "LHDN (tax authority)",
      verified: V,
    },
  ],
  uruguay: [
    {
      name: "New-resident tax holiday",
      headline: "Foreign dividends & interest tax-free for ~11 years (or 7% flat forever)",
      detail:
        "New tax residents choose between a full exemption on foreign financial income for the first years or a permanent 7% flat rate on it.",
      status: "active",
      sourceUrl: "https://www.dgi.gub.uy/",
      sourceLabel: "DGI (tax authority)",
      verified: V,
    },
  ],
  paraguay: [
    {
      name: "Territorial taxation",
      headline: "0% tax on foreign-source income · 10% on local",
      detail:
        "Paraguay taxes only Paraguayan-source income; personal income tax on local income is a flat 10%.",
      status: "active",
      sourceUrl: "https://www.dnit.gov.py/",
      sourceLabel: "DNIT (tax authority)",
      verified: V,
    },
  ],
  panama: [
    {
      name: "Territorial taxation",
      headline: "Foreign-source income untaxed",
      detail:
        "Panama taxes only Panama-source income; foreign salaries, dividends and interest are outside the net.",
      status: "active",
      sourceUrl: "https://dgi.mef.gob.pa/",
      sourceLabel: "DGI (tax authority)",
      verified: V,
    },
  ],
  "costa rica": [
    {
      name: "Territorial taxation",
      headline: "Foreign-source income untaxed",
      detail:
        "Costa Rica taxes only Costa Rican-source income; the digital nomad law also exempts nomad-visa holders' foreign income.",
      status: "active",
      sourceUrl: "https://www.hacienda.go.cr/",
      sourceLabel: "Ministerio de Hacienda",
      verified: V,
    },
  ],
  chile: [
    {
      name: "New-resident exemption",
      headline: "Foreign income tax-free for the first 3 years",
      detail:
        "Foreigners settling in Chile are taxed only on Chilean-source income during their first 3 years of residence (extendable).",
      status: "active",
      sourceUrl: "https://www.sii.cl/",
      sourceLabel: "SII (tax authority)",
      verified: V,
    },
  ],
  "united kingdom": [
    {
      name: "4-year FIG regime (ex non-dom)",
      headline: "Foreign income & gains tax-free for the first 4 years",
      detail:
        "The centuries-old non-dom remittance basis was abolished in April 2025; new arrivals (after 10 years abroad) instead get 4 years of exempt foreign income and gains.",
      status: "changed",
      statusNote: "Replaced the non-dom regime, abolished April 2025",
      sourceUrl: "https://www.gov.uk/government/organisations/hm-revenue-customs",
      sourceLabel: "HMRC",
      verified: V,
    },
  ],
  netherlands: [
    {
      name: "30% ruling (expat ruling)",
      headline: "~30% of salary tax-free · up to 5 years",
      detail:
        "For skilled workers recruited from abroad above a salary threshold; the benefit is capped and is legislated to become a 27% ruling from 2027.",
      status: "changed",
      statusNote: "Being scaled back: capped, and 27% from 2027",
      sourceUrl: "https://www.belastingdienst.nl/",
      sourceLabel: "Belastingdienst",
      verified: V,
    },
  ],
  ireland: [
    {
      name: "SARP relief",
      headline: "30% of income above ~\u20ac100k tax-exempt · 5 years",
      detail:
        "For employees assigned to Ireland by a multinational employer; must be claimed shortly after arrival.",
      status: "active",
      sourceUrl: "https://www.revenue.ie/",
      sourceLabel: "Revenue",
      verified: V,
    },
  ],
  france: [
    {
      name: "Impatriate regime",
      headline: "Impatriation bonus & part of foreign income tax-exempt · up to 8 years",
      detail:
        "For employees recruited abroad by a French company; exempts the impatriation premium and 50% of certain foreign investment income.",
      status: "active",
      sourceUrl: "https://www.impots.gouv.fr/",
      sourceLabel: "impots.gouv.fr",
      verified: V,
    },
  ],
  japan: [
    {
      name: "Non-permanent resident status",
      headline: "Foreign income not remitted to Japan untaxed · first 5 years",
      detail:
        "Foreigners resident under 5 of the last 10 years pay tax only on Japan-source income plus whatever foreign income they bring into Japan.",
      status: "active",
      sourceUrl: "https://www.nta.go.jp/",
      sourceLabel: "NTA (tax agency)",
      verified: V,
    },
  ],
  georgia: [
    {
      name: "Small business status",
      headline: "1% tax on turnover up to ~GEL 500k for individual entrepreneurs",
      detail:
        "Registered individual entrepreneurs pay 1% of turnover; individuals are also taxed territorially, so most foreign-source income is exempt.",
      status: "active",
      sourceUrl: "https://www.rs.ge/",
      sourceLabel: "Revenue Service",
      verified: V,
    },
  ],
  switzerland: [
    {
      name: "Lump-sum taxation (forfait)",
      headline: "Tax negotiated on living expenses, not income",
      detail:
        "For wealthy foreigners who don't work in Switzerland; available in most cantons with high minimum taxable bases.",
      status: "active",
      sourceUrl: "https://www.estv.admin.ch/",
      sourceLabel: "Federal Tax Administration",
      verified: V,
    },
  ],
  "new zealand": [
    {
      name: "Transitional resident exemption",
      headline: "Most foreign income tax-free for ~4 years",
      detail:
        "New migrants (and returning Kiwis away 10+ years) are exempt on most foreign-source income for 48 months; one-time only.",
      status: "active",
      sourceUrl: "https://www.ird.govt.nz/",
      sourceLabel: "Inland Revenue",
      verified: V,
    },
  ],
  "united states": [
    {
      name: "No inbound regime (worldwide taxation)",
      headline: "Residents are taxed on worldwide income",
      detail:
        "No special expat break for arrivals; the US taxes residents (and its citizens everywhere) on worldwide income, with foreign tax credits to offset double taxation.",
      status: "active",
      sourceUrl: "https://www.irs.gov/",
      sourceLabel: "IRS",
      verified: V,
    },
  ],
  germany: [
    {
      name: "No inbound regime (worldwide taxation)",
      headline: "Residents are taxed on worldwide income",
      detail:
        "Germany has no special expat tax break; progressive rates up to 45% plus solidarity surcharge apply once you become tax resident.",
      status: "active",
      sourceUrl: "https://www.bundesfinanzministerium.de/",
      sourceLabel: "Finance Ministry",
      verified: V,
    },
  ],
  canada: [
    {
      name: "No inbound regime (worldwide taxation)",
      headline: "Residents are taxed on worldwide income",
      detail:
        "No special expat break; newcomers get a step-up in the cost base of assets on arrival, which matters for capital gains later.",
      status: "active",
      sourceUrl: "https://www.canada.ca/en/revenue-agency.html",
      sourceLabel: "CRA",
      verified: V,
    },
  ],
  australia: [
    {
      name: "Temporary resident exemption",
      headline: "Most foreign income tax-free while on a temporary visa",
      detail:
        "Temporary visa holders are generally exempt from Australian tax on foreign-source investment income; ends when you become a permanent resident.",
      status: "active",
      sourceUrl: "https://www.ato.gov.au/",
      sourceLabel: "ATO",
      verified: V,
    },
  ],
  mexico: [
    {
      name: "No inbound regime (worldwide taxation)",
      headline: "Residents are taxed on worldwide income",
      detail:
        "Mexico taxes residents on worldwide income at progressive rates up to 35%; treaties and foreign tax credits mitigate double taxation.",
      status: "active",
      sourceUrl: "https://www.sat.gob.mx/",
      sourceLabel: "SAT",
      verified: V,
    },
  ],
  poland: [
    {
      name: "Return relief & lump-sum option",
      headline: "PIT exemption up to ~PLN 85k/yr · 4 years (returnees)",
      detail:
        "\u201cUlga na powr\u00f3t\u201d exempts part of employment income for people moving tax residence to Poland; wealthy arrivals can opt for a PLN 200k/yr lump sum on foreign income.",
      status: "active",
      sourceUrl: "https://www.podatki.gov.pl/",
      sourceLabel: "podatki.gov.pl",
      verified: V,
    },
  ],
};

const BY_NORM: Record<string, TaxRegime[]> = Object.fromEntries(
  Object.entries(TAX_REGIMES).map(([name, v]) => [normalizeName(name), v]),
);

export function taxRegimesForCountry(country: string): TaxRegime[] {
  return BY_NORM[normalizeName(country)] ?? [];
}
