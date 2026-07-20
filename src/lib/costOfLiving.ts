// Cost-of-living data for the /cost-of-living/[country] pages, keyed by
// destination slug (src/lib/countries.ts). This is broad, public, sourced cost
// data (rent, groceries, a realistic monthly budget) — the free SEO layer. The
// paid $9 plan is the personalized synthesis; these numbers are not that.
//
// The detailed monthly breakdown is populated per country as it is researched
// against sources (Numbeo / Expatistan / official statistics + tariff pages).
// Countries without an entry render the page from the data we already have
// (Big Mac, EU price level, inflation, salary) and simply omit the budget
// tables — no thin placeholder numbers.

// Month the cost detail was last reviewed.
export const COST_OF_LIVING_VERIFIED = "2026-07";

// A money figure as a low–high range, in both local currency and USD. Costs
// vary a lot, so we never publish a single false-precision number.
export interface MoneyRange {
  /** [low, high] in the local currency's major units. */
  local: [number, number];
  /** [low, high] in USD at the `asOf` month's FX. */
  usd: [number, number];
  /** Optional caveat on this specific figure. */
  note?: string;
}

export type CityTier = "capital" | "major" | "popular_expat";

// One representative city's monthly costs. Every field is optional so a partial
// research result still renders whatever is known.
export interface CityCost {
  city: string;
  tier: CityTier;
  rent1brCenter?: MoneyRange;
  rent1brOutside?: MoneyRange;
  rent3brCenter?: MoneyRange;
  utilitiesBasic?: MoneyRange;
  internet?: MoneyRange;
  mobilePlan?: MoneyRange;
  groceriesSingle?: MoneyRange;
  mealInexpensive?: MoneyRange;
  mealMidForTwo?: MoneyRange;
  publicTransportPass?: MoneyRange;
  /** Realistic all-in monthly budget for one adult (incl. mid-range rent). */
  monthlyBudgetSingle?: MoneyRange;
  /** Realistic all-in monthly budget for a family of four. */
  monthlyBudgetFamily4?: MoneyRange;
}

export interface CostSource {
  label: string;
  url: string;
  /** YYYY-MM the source was accessed. */
  accessed: string;
}

export interface CountryCost {
  /** ISO 4217 code of the local currency the `local` figures are in. */
  currency: string;
  /** YYYY-MM the figures reflect. */
  asOf: string;
  /** 1–3 representative cities, capital first. */
  cities: CityCost[];
  /** Typical monthly private/expat health insurance, USD range. */
  privateHealthInsuranceMonthUsd?: { low: number; high: number; note?: string };
  /** Overall cost-of-living index vs the USA (USA = 100). */
  costIndexVsUsa?: {
    value: number;
    basis: string;
    source: string;
    sourceUrl?: string;
  };
  /** Headline income-tax note (not a personalized calculation). */
  incomeTaxHeadline?: { note: string; sourceUrl?: string };
  /** Standard VAT / GST rate headline. */
  vatRate?: { value: number; note?: string; sourceUrl?: string };
  /** 2–4 honest, specific, decision-useful cost notes. */
  keyCostNotes: string[];
  sources: CostSource[];
}

// Slugs with researched cost detail. Empty until the deep-research data lands;
// countries not listed render from existing data only (see page component).
const COST_DETAIL: Record<string, CountryCost> = {
  "portugal": {
    currency: "EUR",
    asOf: "2026-07",
    cities: [
      {
        city: "Lisbon",
        tier: "capital",
        rent1brCenter: { local: [1400, 2200], usd: [1600, 2500] },
        rent1brOutside: { local: [900, 1400], usd: [1030, 1600] },
        rent3brCenter: { local: [2000, 3500], usd: [2300, 4000] },
        utilitiesBasic: { local: [100, 180], usd: [115, 210] },
        internet: { local: [25, 35], usd: [29, 40] },
        mobilePlan: { local: [15, 30], usd: [17, 34] },
        groceriesSingle: { local: [220, 320], usd: [250, 365] },
        mealInexpensive: { local: [8, 12], usd: [9, 14] },
        mealMidForTwo: { local: [35, 55], usd: [40, 63] },
        publicTransportPass: { local: [40, 51], usd: [46, 58] },
        monthlyBudgetSingle: { local: [700, 950], usd: [800, 1100] },
        monthlyBudgetFamily4: { local: [2400, 3000], usd: [2750, 3450] },
      },
      {
        city: "Porto",
        tier: "major",
        rent1brCenter: { local: [1000, 1600], usd: [1150, 1850] },
        rent1brOutside: { local: [700, 1100], usd: [800, 1260] },
        rent3brCenter: { local: [1800, 2600], usd: [2050, 3000] },
        utilitiesBasic: { local: [90, 160], usd: [103, 185] },
        internet: { local: [25, 35], usd: [29, 40] },
        mobilePlan: { local: [15, 25], usd: [17, 29] },
        groceriesSingle: { local: [210, 300], usd: [240, 345] },
        mealInexpensive: { local: [8, 11], usd: [9, 13] },
        mealMidForTwo: { local: [30, 50], usd: [34, 58] },
        publicTransportPass: { local: [40, 45], usd: [46, 52] },
        monthlyBudgetSingle: { local: [650, 900], usd: [750, 1040] },
        monthlyBudgetFamily4: { local: [2200, 2800], usd: [2500, 3200] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 50, high: 150, note: "Private cover for expats/residents (Médis, Multicare) on top of the public SNS; adult 30–45, mid-level coverage." },
    costIndexVsUsa: { value: 70, basis: "USA = 100, excluding rent (Numbeo / 2026 reviews).", source: "Numbeo 2026; Western Union 2026", sourceUrl: "https://www.numbeo.com/cost-of-living/rankings_by_country.jsp?title=2026" },
    incomeTaxHeadline: { note: "Progressive income tax ~12.5–48% plus a 2.5–5% solidarity surcharge on high incomes; residents are taxed on worldwide income.", sourceUrl: "https://taxsummaries.pwc.com/portugal/individual/taxes-on-personal-income" },
    vatRate: { value: 23, note: "Standard IVA (VAT) rate on the mainland.", sourceUrl: "https://amavat.eu/vat-in-portugal-in-2024/" },
    keyCostNotes: [
      "Lisbon's rental market is highly segmented: the historic centre and tourist districts run 30–50% above the suburbs and inland towns.",
      "Groceries and eating out are cheaper than in Northern Europe; shopping at local markets and eating seasonally cuts the basket by 20–30%.",
      "The public SNS is good quality, but appointment and family-doctor waits can run weeks — private insurance buys speed.",
      "On the Algarve coast rents and restaurant prices rise sharply in high season; long-term leases often exclude the summer months.",
    ],
    sources: [
      { label: "Numbeo Cost of Living Portugal", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Portugal", accessed: "2026-07" },
      { label: "Expatistan Cost of Living Lisbon", url: "https://www.expatistan.com/cost-of-living/lisbon", accessed: "2026-07" },
      { label: "Portugal Cost of Living 2026 — The Portugal Brief", url: "https://theportugalbrief.pt/portugal-cost-of-living-in-2026-the-numbers-that-actually-matter-for-expats/", accessed: "2026-07" },
      { label: "PwC Portugal — Personal Income Tax 2026", url: "https://taxsummaries.pwc.com/portugal/individual/taxes-on-personal-income", accessed: "2026-07" },
      { label: "Portugal VAT 2026 Overview", url: "https://amavat.eu/vat-in-portugal-in-2024/", accessed: "2026-07" },
    ],
  },
  "spain": {
    currency: "EUR",
    asOf: "2026-07",
    cities: [
      {
        city: "Madrid",
        tier: "capital",
        rent1brCenter: { local: [1200, 1900], usd: [1370, 2150] },
        rent1brOutside: { local: [800, 1300], usd: [910, 1470] },
        rent3brCenter: { local: [1900, 3000], usd: [2170, 3430] },
        utilitiesBasic: { local: [100, 180], usd: [115, 210] },
        internet: { local: [30, 40], usd: [34, 46] },
        mobilePlan: { local: [15, 25], usd: [17, 29] },
        groceriesSingle: { local: [220, 320], usd: [250, 365] },
        mealInexpensive: { local: [10, 15], usd: [11, 17] },
        mealMidForTwo: { local: [45, 70], usd: [52, 80] },
        publicTransportPass: { local: [40, 60], usd: [46, 69] },
        monthlyBudgetSingle: { local: [700, 1000], usd: [800, 1150] },
        monthlyBudgetFamily4: { local: [2400, 3200], usd: [2750, 3650] },
      },
      {
        city: "Barcelona",
        tier: "major",
        rent1brCenter: { local: [1300, 2000], usd: [1480, 2270] },
        rent1brOutside: { local: [900, 1400], usd: [1030, 1600] },
        rent3brCenter: { local: [2100, 3200], usd: [2400, 3630] },
        utilitiesBasic: { local: [110, 190], usd: [126, 218] },
        internet: { local: [30, 45], usd: [34, 52] },
        mobilePlan: { local: [15, 25], usd: [17, 29] },
        groceriesSingle: { local: [230, 340], usd: [260, 390] },
        mealInexpensive: { local: [12, 18], usd: [14, 20] },
        mealMidForTwo: { local: [50, 75], usd: [57, 85] },
        publicTransportPass: { local: [45, 60], usd: [52, 69] },
        monthlyBudgetSingle: { local: [750, 1100], usd: [860, 1260] },
        monthlyBudgetFamily4: { local: [2500, 3400], usd: [2860, 3880] },
      },
      {
        city: "Valencia",
        tier: "popular_expat",
        rent1brCenter: { local: [800, 1200], usd: [910, 1370] },
        rent1brOutside: { local: [600, 900], usd: [680, 1030] },
        rent3brCenter: { local: [1400, 2100], usd: [1600, 2380] },
        utilitiesBasic: { local: [90, 160], usd: [103, 185] },
        internet: { local: [25, 35], usd: [29, 40] },
        mobilePlan: { local: [15, 25], usd: [17, 29] },
        groceriesSingle: { local: [200, 280], usd: [230, 320] },
        mealInexpensive: { local: [10, 14], usd: [11, 16] },
        mealMidForTwo: { local: [40, 60], usd: [46, 69] },
        publicTransportPass: { local: [35, 50], usd: [40, 57] },
        monthlyBudgetSingle: { local: [650, 900], usd: [750, 1040] },
        monthlyBudgetFamily4: { local: [2200, 2900], usd: [2520, 3300] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 60, high: 160, note: "Private insurance (Sanitas, Adeslas, etc.) for residents and expats; adult 30–45, mid-level cover, dental excluded." },
    costIndexVsUsa: { value: 65, basis: "USA = 100, excluding rent (Numbeo 2026).", source: "Numbeo 2026", sourceUrl: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Spain" },
    incomeTaxHeadline: { note: "Progressive IRPF roughly 19–47%; residents taxed on worldwide income, with regional surcharges and preferential regimes.", sourceUrl: "https://taxsummaries.pwc.com/spain/individual/taxes-on-personal-income" },
    vatRate: { value: 21, note: "Standard IVA; reduced 10% and 4% rates on some goods and services.", sourceUrl: "https://taxsummaries.pwc.com/quick-charts/value-added-tax-vat-rates" },
    keyCostNotes: [
      "Rent in Barcelona and Madrid is markedly higher than in Valencia and secondary cities — the gap on central 1-beds reaches 30–40%.",
      "'Menú del día' lunches stay affordable (€10–15), but tourist areas of Barcelona and Madrid are much pricier.",
      "Private healthcare and insurance are mostly used to speed up specialist access versus the public system.",
      "On the coast (Costa del Sol, Balearics) seasonality strongly affects rent; long-term leases often exclude summer.",
    ],
    sources: [
      { label: "Numbeo Cost of Living Spain", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Spain", accessed: "2026-06" },
      { label: "Numbeo City Data — Madrid, Barcelona, Valencia", url: "https://www.numbeo.com/cost-of-living/", accessed: "2026-06" },
      { label: "Cost of Living in Spain 2026 — Migrun", url: "https://www.migrun.tech/blog/cost-of-living-in-spain-expats-2026", accessed: "2026-07" },
      { label: "PwC Spain — Personal Income Tax", url: "https://taxsummaries.pwc.com/spain/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
  "germany": {
    currency: "EUR",
    asOf: "2026-07",
    cities: [
      {
        city: "Berlin",
        tier: "capital",
        rent1brCenter: { local: [1100, 1700], usd: [1250, 1930] },
        rent1brOutside: { local: [800, 1300], usd: [910, 1470] },
        rent3brCenter: { local: [1900, 2800], usd: [2170, 3180] },
        utilitiesBasic: { local: [150, 230], usd: [170, 260] },
        internet: { local: [30, 40], usd: [34, 46] },
        mobilePlan: { local: [20, 30], usd: [23, 34] },
        groceriesSingle: { local: [250, 350], usd: [285, 400] },
        mealInexpensive: { local: [12, 18], usd: [14, 20] },
        mealMidForTwo: { local: [55, 85], usd: [63, 97] },
        publicTransportPass: { local: [49, 60], usd: [56, 69] },
        monthlyBudgetSingle: { local: [800, 1150], usd: [910, 1320] },
        monthlyBudgetFamily4: { local: [2700, 3400], usd: [3080, 3880] },
      },
      {
        city: "Munich",
        tier: "major",
        rent1brCenter: { local: [1400, 2100], usd: [1600, 2380] },
        rent1brOutside: { local: [1000, 1500], usd: [1150, 1700] },
        rent3brCenter: { local: [2300, 3400], usd: [2630, 3880] },
        utilitiesBasic: { local: [160, 250], usd: [183, 285] },
        internet: { local: [30, 45], usd: [34, 52] },
        mobilePlan: { local: [20, 35], usd: [23, 40] },
        groceriesSingle: { local: [270, 380], usd: [310, 430] },
        mealInexpensive: { local: [13, 20], usd: [15, 23] },
        mealMidForTwo: { local: [60, 95], usd: [69, 108] },
        publicTransportPass: { local: [60, 70], usd: [69, 80] },
        monthlyBudgetSingle: { local: [850, 1200], usd: [970, 1370] },
        monthlyBudgetFamily4: { local: [2800, 3600], usd: [3190, 4100] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 100, high: 250, note: "Private cover (PKV) or top-up packages on the public GKV; adult 30–45, no serious chronic conditions." },
    costIndexVsUsa: { value: 75, basis: "USA = 100, excluding rent; Numbeo puts Germany ~7–15% below the USA on day-to-day costs.", source: "Numbeo 2026", sourceUrl: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Germany" },
    incomeTaxHeadline: { note: "Progressive income tax ~14–45% plus solidarity surcharge; residents taxed on worldwide income.", sourceUrl: "https://taxsummaries.pwc.com/germany/individual/taxes-on-personal-income" },
    vatRate: { value: 19, note: "Standard VAT rate; reduced 7% rate on some goods and services.", sourceUrl: "https://taxsummaries.pwc.com/quick-charts/value-added-tax-vat-rates" },
    keyCostNotes: [
      "Rent in Munich and Hamburg is much higher than in Berlin and secondary cities; long leases often require a 2–3 month deposit.",
      "Utilities (heating especially) are a major line item; energy-efficient housing cuts bills substantially.",
      "The public GKV system is good quality; private insurance is mainly for speed and certain services.",
      "Transit passes and the nationwide €49 ticket sharply reduce overall travel costs.",
    ],
    sources: [
      { label: "Numbeo Cost of Living Germany", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Germany", accessed: "2026-06" },
      { label: "Cost of Living in Germany — uhomes 2024", url: "https://en.uhomes.com/blog/cost-of-living-in-germany", accessed: "2026-07" },
      { label: "PwC Germany — Personal Income Tax", url: "https://taxsummaries.pwc.com/germany/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
  "netherlands": {
    currency: "EUR",
    asOf: "2026-07",
    cities: [
      {
        city: "Amsterdam",
        tier: "capital",
        rent1brCenter: { local: [1700, 2500], usd: [1940, 2850] },
        rent1brOutside: { local: [1300, 1900], usd: [1480, 2170] },
        rent3brCenter: { local: [2600, 3800], usd: [2970, 4340] },
        utilitiesBasic: { local: [160, 240], usd: [183, 275] },
        internet: { local: [35, 50], usd: [40, 57] },
        mobilePlan: { local: [20, 35], usd: [23, 40] },
        groceriesSingle: { local: [280, 380], usd: [320, 430] },
        mealInexpensive: { local: [15, 23], usd: [17, 26] },
        mealMidForTwo: { local: [65, 95], usd: [74, 108] },
        publicTransportPass: { local: [60, 90], usd: [69, 103] },
        monthlyBudgetSingle: { local: [900, 1250], usd: [1030, 1430] },
        monthlyBudgetFamily4: { local: [3100, 3900], usd: [3550, 4470] },
      },
      {
        city: "Utrecht",
        tier: "major",
        rent1brCenter: { local: [1400, 2100], usd: [1600, 2400] },
        rent1brOutside: { local: [1100, 1700], usd: [1250, 1940] },
        rent3brCenter: { local: [2300, 3300], usd: [2630, 3770] },
        utilitiesBasic: { local: [150, 230], usd: [170, 260] },
        internet: { local: [35, 50], usd: [40, 57] },
        mobilePlan: { local: [20, 35], usd: [23, 40] },
        groceriesSingle: { local: [270, 370], usd: [310, 420] },
        mealInexpensive: { local: [14, 22], usd: [16, 25] },
        mealMidForTwo: { local: [60, 90], usd: [69, 103] },
        publicTransportPass: { local: [60, 80], usd: [69, 92] },
        monthlyBudgetSingle: { local: [850, 1200], usd: [970, 1370] },
        monthlyBudgetFamily4: { local: [2900, 3700], usd: [3320, 4250] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 120, high: 220, note: "Mandatory basic insurance (zorgverzekering) plus optional top-ups; adult 30–45, no serious chronic conditions." },
    costIndexVsUsa: { value: 80, basis: "USA = 100, excluding rent; Numbeo puts the Netherlands close to the USA, slightly below.", source: "Numbeo 2025/2026", sourceUrl: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Netherlands" },
    incomeTaxHeadline: { note: "Progressive income tax ~9–49.5% (Box 1) plus social-security contributions; separate regimes for Box 2/3.", sourceUrl: "https://taxsummaries.pwc.com/netherlands/individual/taxes-on-personal-income" },
    vatRate: { value: 21, note: "Standard BTW rate; reduced 9% rate on food and some services.", sourceUrl: "https://taxsummaries.pwc.com/quick-charts/value-added-tax-vat-rates" },
    keyCostNotes: [
      "Rent in Amsterdam and Utrecht is among the highest in the EU; 2–3 month deposits and agency fees are standard.",
      "Groceries and eating out cost noticeably more than in Southern Europe; cooking at home and discounters (Lidl, Aldi) save money.",
      "Mandatory health insurance adds materially to the budget, and the deductible (eigen risico) creates extra costs when you use the system.",
      "Dense public transport and cycling infrastructure let you skip a car, especially in the big cities.",
    ],
    sources: [
      { label: "Numbeo Cost of Living Netherlands", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Netherlands", accessed: "2026-07" },
      { label: "Relocate.me — Cost of Living in the Netherlands", url: "https://relocate.me/cost-of-living/netherlands", accessed: "2026-07" },
      { label: "PwC Netherlands — Personal Income Tax", url: "https://taxsummaries.pwc.com/netherlands/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
  "france": {
    currency: "EUR",
    asOf: "2026-07",
    cities: [
      {
        city: "Paris",
        tier: "capital",
        rent1brCenter: { local: [1600, 2600], usd: [1830, 2950] },
        rent1brOutside: { local: [1200, 1900], usd: [1370, 2170] },
        rent3brCenter: { local: [2800, 4200], usd: [3200, 4770] },
        utilitiesBasic: { local: [140, 220], usd: [160, 250] },
        internet: { local: [30, 45], usd: [34, 52] },
        mobilePlan: { local: [15, 30], usd: [17, 34] },
        groceriesSingle: { local: [270, 380], usd: [310, 430] },
        mealInexpensive: { local: [15, 22], usd: [17, 25] },
        mealMidForTwo: { local: [70, 100], usd: [80, 115] },
        publicTransportPass: { local: [75, 85], usd: [86, 97] },
        monthlyBudgetSingle: { local: [850, 1250], usd: [970, 1430] },
        monthlyBudgetFamily4: { local: [3000, 3800], usd: [3450, 4370] },
      },
      {
        city: "Lyon",
        tier: "major",
        rent1brCenter: { local: [1100, 1700], usd: [1250, 1930] },
        rent1brOutside: { local: [800, 1300], usd: [910, 1470] },
        rent3brCenter: { local: [2000, 3000], usd: [2290, 3430] },
        utilitiesBasic: { local: [130, 210], usd: [149, 240] },
        internet: { local: [30, 45], usd: [34, 52] },
        mobilePlan: { local: [15, 25], usd: [17, 29] },
        groceriesSingle: { local: [250, 360], usd: [285, 410] },
        mealInexpensive: { local: [14, 20], usd: [16, 23] },
        mealMidForTwo: { local: [60, 90], usd: [69, 103] },
        publicTransportPass: { local: [55, 70], usd: [63, 80] },
        monthlyBudgetSingle: { local: [800, 1150], usd: [910, 1320] },
        monthlyBudgetFamily4: { local: [2800, 3600], usd: [3220, 4140] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 60, high: 180, note: "Optional private 'mutuelle' cover on top of the public system; adult 30–45, mid-level coverage." },
    costIndexVsUsa: { value: 75, basis: "USA = 100, excluding rent; Numbeo puts France slightly below the USA on day-to-day costs.", source: "Numbeo 2026", sourceUrl: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=France" },
    incomeTaxHeadline: { note: "Progressive income tax roughly 11–45% plus social contributions; residents taxed on worldwide income.", sourceUrl: "https://taxsummaries.pwc.com/france/individual/taxes-on-personal-income" },
    vatRate: { value: 20, note: "Standard TVA rate; reduced 10% and 5.5% rates on some goods and services.", sourceUrl: "https://taxsummaries.pwc.com/quick-charts/value-added-tax-vat-rates" },
    keyCostNotes: [
      "Rent and dining in Paris are much dearer than the rest of the country; moving to Lyon, Toulouse or Bordeaux lowers the overall budget.",
      "The public health system covers basics well; a mutuelle is used for co-pays and dental.",
      "Cafés and restaurants in tourist quarters of Paris carry a big markup; local bistros outside the centre are far cheaper.",
      "High taxes and social contributions make gross salaries much higher than net — worth factoring into budgets.",
    ],
    sources: [
      { label: "Numbeo Cost of Living France", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=France", accessed: "2026-07" },
      { label: "KoronaPay Blog — Cost of Living in France", url: "https://koronapay.com/transfers/europe/en/blog/cost-of-living-in-france/", accessed: "2026-07" },
      { label: "PwC France — Personal Income Tax", url: "https://taxsummaries.pwc.com/france/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
  "italy": {
    currency: "EUR",
    asOf: "2026-07",
    cities: [
      {
        city: "Rome",
        tier: "capital",
        rent1brCenter: { local: [1100, 1700], usd: [1250, 1930] },
        rent1brOutside: { local: [800, 1300], usd: [910, 1470] },
        rent3brCenter: { local: [1900, 2800], usd: [2170, 3180] },
        utilitiesBasic: { local: [110, 190], usd: [126, 218] },
        internet: { local: [25, 35], usd: [29, 40] },
        mobilePlan: { local: [15, 25], usd: [17, 29] },
        groceriesSingle: { local: [230, 330], usd: [260, 380] },
        mealInexpensive: { local: [12, 18], usd: [14, 20] },
        mealMidForTwo: { local: [55, 80], usd: [63, 92] },
        publicTransportPass: { local: [35, 55], usd: [40, 63] },
        monthlyBudgetSingle: { local: [700, 1000], usd: [800, 1150] },
        monthlyBudgetFamily4: { local: [2400, 3200], usd: [2750, 3650] },
      },
      {
        city: "Milan",
        tier: "major",
        rent1brCenter: { local: [1300, 2100], usd: [1480, 2380] },
        rent1brOutside: { local: [900, 1500], usd: [1030, 1700] },
        rent3brCenter: { local: [2200, 3400], usd: [2510, 3880] },
        utilitiesBasic: { local: [130, 210], usd: [149, 240] },
        internet: { local: [25, 35], usd: [29, 40] },
        mobilePlan: { local: [15, 25], usd: [17, 29] },
        groceriesSingle: { local: [240, 340], usd: [275, 390] },
        mealInexpensive: { local: [14, 20], usd: [16, 23] },
        mealMidForTwo: { local: [60, 85], usd: [69, 97] },
        publicTransportPass: { local: [40, 65], usd: [46, 75] },
        monthlyBudgetSingle: { local: [750, 1050], usd: [860, 1200] },
        monthlyBudgetFamily4: { local: [2500, 3300], usd: [2860, 3790] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 50, high: 150, note: "Private policies on top of the public SSN (Servizio Sanitario Nazionale); adult 30–45, basic coverage." },
    costIndexVsUsa: { value: 65, basis: "USA = 100, excluding rent; Numbeo puts Italy roughly 30–40% below the USA.", source: "Numbeo 2025/2026", sourceUrl: "https://it.numbeo.com/costo-della-vita/nazione/Italia" },
    incomeTaxHeadline: { note: "Progressive IRPEF roughly 23–43% plus regional and municipal surcharges; residents taxed on worldwide income.", sourceUrl: "https://taxsummaries.pwc.com/italy/individual/taxes-on-personal-income" },
    vatRate: { value: 22, note: "Standard IVA; reduced 10% and 4% rates on some goods and services.", sourceUrl: "https://taxsummaries.pwc.com/quick-charts/value-added-tax-vat-rates" },
    keyCostNotes: [
      "Sharp contrast between the North (Milan, Turin) and South (Naples, Bari) on rent and wages; a Milan budget is well above the Italian average.",
      "Public healthcare covers basics well, but private policies are common for fast appointments and dental.",
      "Historic-centre leases often restrict use (Airbnb, sublets), and deposits run 2–3 months.",
      "Local-market groceries and seasonal cooking are far cheaper than restaurants in tourist areas.",
    ],
    sources: [
      { label: "Numbeo Cost of Living Italy", url: "https://it.numbeo.com/costo-della-vita/nazione/Italia", accessed: "2026-07" },
      { label: "Global Cost Data — Italy", url: "https://globalcostdata.com/cost-of-living/by-country/italy/", accessed: "2026-07" },
      { label: "PwC Italy — Personal Income Tax", url: "https://taxsummaries.pwc.com/italy/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
  "ireland": {
    currency: "EUR",
    asOf: "2026-07",
    cities: [
      {
        city: "Dublin",
        tier: "capital",
        rent1brCenter: { local: [1800, 2600], usd: [2050, 2950] },
        rent1brOutside: { local: [1400, 2100], usd: [1600, 2400] },
        rent3brCenter: { local: [2800, 4200], usd: [3200, 4770] },
        utilitiesBasic: { local: [140, 220], usd: [160, 250] },
        internet: { local: [40, 60], usd: [46, 69] },
        mobilePlan: { local: [20, 35], usd: [23, 40] },
        groceriesSingle: { local: [280, 380], usd: [320, 430] },
        mealInexpensive: { local: [15, 22], usd: [17, 25] },
        mealMidForTwo: { local: [75, 110], usd: [86, 125] },
        publicTransportPass: { local: [120, 160], usd: [137, 185] },
        monthlyBudgetSingle: { local: [900, 1300], usd: [1030, 1490] },
        monthlyBudgetFamily4: { local: [3200, 4100], usd: [3660, 4690] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 80, high: 200, note: "Private insurance (VHI, Irish Life) on top of the public system; adult 30–45, mid-level coverage." },
    costIndexVsUsa: { value: 85, basis: "USA = 100, excluding rent; Numbeo puts Ireland close to the USA on day-to-day costs.", source: "Numbeo 2025/2026", sourceUrl: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Ireland" },
    incomeTaxHeadline: { note: "Progressive income tax roughly 20–40% plus USC and PRSI; residents taxed on worldwide income.", sourceUrl: "https://taxsummaries.pwc.com/ireland/individual/taxes-on-personal-income" },
    vatRate: { value: 23, note: "Standard VAT rate; reduced 13.5% and 9% rates on some goods and services.", sourceUrl: "https://taxsummaries.pwc.com/quick-charts/value-added-tax-vat-rates" },
    keyCostNotes: [
      "Dublin is one of Europe's most expensive rental markets; strong tech-sector demand and limited supply keep rents high.",
      "Groceries and eating out cost more than in continental Europe; home cooking and discounters are the main way to save.",
      "The public health system is overstretched; many expats take private insurance to speed up access.",
      "Transport and central parking in Dublin are pricey; living near a DART/LUAS line pays off.",
    ],
    sources: [
      { label: "Numbeo Cost of Living Ireland", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Ireland", accessed: "2026-07" },
      { label: "Numbeo — Dublin Quality of Life & Costs", url: "https://www.numbeo.com/quality-of-life/in/Dublin", accessed: "2026-07" },
      { label: "PwC Ireland — Personal Income Tax", url: "https://taxsummaries.pwc.com/ireland/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
  "united-kingdom": {
    currency: "GBP",
    asOf: "2026-07",
    cities: [
      {
        city: "London",
        tier: "capital",
        rent1brCenter: { local: [1900, 2800], usd: [2400, 3550] },
        rent1brOutside: { local: [1400, 2200], usd: [1770, 2800] },
        rent3brCenter: { local: [3000, 4500], usd: [3800, 5700] },
        utilitiesBasic: { local: [130, 210], usd: [165, 270] },
        internet: { local: [25, 40], usd: [32, 51] },
        mobilePlan: { local: [15, 30], usd: [19, 38] },
        groceriesSingle: { local: [220, 320], usd: [280, 410] },
        mealInexpensive: { local: [12, 20], usd: [15, 25] },
        mealMidForTwo: { local: [60, 100], usd: [76, 127] },
        publicTransportPass: { local: [160, 220], usd: [203, 280] },
        monthlyBudgetSingle: { local: [750, 1100], usd: [950, 1400] },
        monthlyBudgetFamily4: { local: [2700, 3500], usd: [3400, 4400] },
      },
      {
        city: "Manchester",
        tier: "major",
        rent1brCenter: { local: [900, 1400], usd: [1140, 1770] },
        rent1brOutside: { local: [700, 1100], usd: [890, 1400] },
        rent3brCenter: { local: [1500, 2300], usd: [1900, 2910] },
        utilitiesBasic: { local: [110, 190], usd: [140, 245] },
        internet: { local: [25, 40], usd: [32, 51] },
        mobilePlan: { local: [15, 25], usd: [19, 32] },
        groceriesSingle: { local: [210, 300], usd: [270, 385] },
        mealInexpensive: { local: [10, 16], usd: [13, 20] },
        mealMidForTwo: { local: [50, 80], usd: [63, 102] },
        publicTransportPass: { local: [80, 110], usd: [102, 140] },
        monthlyBudgetSingle: { local: [700, 1000], usd: [885, 1270] },
        monthlyBudgetFamily4: { local: [2400, 3200], usd: [3040, 4050] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 60, high: 150, note: "Private insurance (Bupa, AXA, Vitality) on top of the NHS; adult 30–45, mid-level cover, fast specialist access." },
    costIndexVsUsa: { value: 80, basis: "USA = 100, excluding rent; Numbeo and reviews put the UK slightly below the USA on day-to-day costs.", source: "Numbeo 2025/2026", sourceUrl: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=United+Kingdom" },
    incomeTaxHeadline: { note: "Progressive Income Tax roughly 20–45% plus National Insurance; residents taxed on worldwide income, with a non-dom regime.", sourceUrl: "https://taxsummaries.pwc.com/united-kingdom/individual/taxes-on-personal-income" },
    vatRate: { value: 20, note: "Standard VAT rate; reduced rates and exemptions on some goods and services.", sourceUrl: "https://taxsummaries.pwc.com/quick-charts/value-added-tax-vat-rates" },
    keyCostNotes: [
      "London is far pricier than other cities; moving to Manchester, Leeds or Glasgow markedly lowers rent.",
      "The NHS is free at point of use, but GP and specialist waits can run several weeks.",
      "Transport in London is expensive; living near Tube/Overground lines and using monthly passes helps.",
      "Eating out carries a heavy markup over home cooking; discounters (Lidl, Aldi) and meal kits save money.",
    ],
    sources: [
      { label: "Numbeo Cost of Living United Kingdom", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=United+Kingdom", accessed: "2026-07" },
      { label: "Expatistan — Cost of Living in London", url: "https://www.expatistan.com/cost-of-living/london", accessed: "2026-07" },
      { label: "PwC United Kingdom — Personal Income Tax", url: "https://taxsummaries.pwc.com/united-kingdom/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
  "canada": {
    currency: "CAD",
    asOf: "2026-07",
    cities: [
      {
        city: "Ottawa",
        tier: "capital",
        rent1brCenter: { local: [1500, 2200], usd: [1100, 1600] },
        rent1brOutside: { local: [1200, 1800], usd: [880, 1300] },
        rent3brCenter: { local: [2300, 3400], usd: [1700, 2500] },
        utilitiesBasic: { local: [130, 200], usd: [95, 145] },
        internet: { local: [60, 90], usd: [45, 70] },
        mobilePlan: { local: [50, 80], usd: [37, 60] },
        groceriesSingle: { local: [350, 500], usd: [260, 370] },
        mealInexpensive: { local: [18, 25], usd: [13, 18] },
        mealMidForTwo: { local: [80, 130], usd: [60, 95] },
        publicTransportPass: { local: [120, 160], usd: [88, 118] },
        monthlyBudgetSingle: { local: [900, 1300], usd: [660, 950] },
        monthlyBudgetFamily4: { local: [3000, 4000], usd: [2200, 2950] },
      },
      {
        city: "Toronto",
        tier: "major",
        rent1brCenter: { local: [1900, 2800], usd: [1400, 2050] },
        rent1brOutside: { local: [1500, 2200], usd: [1100, 1600] },
        rent3brCenter: { local: [2800, 4200], usd: [2050, 3100] },
        utilitiesBasic: { local: [150, 230], usd: [110, 170] },
        internet: { local: [70, 100], usd: [52, 75] },
        mobilePlan: { local: [60, 90], usd: [45, 70] },
        groceriesSingle: { local: [380, 550], usd: [280, 400] },
        mealInexpensive: { local: [20, 28], usd: [15, 21] },
        mealMidForTwo: { local: [90, 140], usd: [66, 103] },
        publicTransportPass: { local: [140, 180], usd: [103, 132] },
        monthlyBudgetSingle: { local: [950, 1400], usd: [700, 1030] },
        monthlyBudgetFamily4: { local: [3200, 4300], usd: [2360, 3150] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 60, high: 160, note: "Top-up policies on top of provincial public cover (OHIP, RAMQ, etc.); adult 30–45." },
    costIndexVsUsa: { value: 80, basis: "USA = 100, excluding rent; Numbeo puts Canada slightly below the USA on day-to-day costs.", source: "Numbeo 2025/2026", sourceUrl: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Canada" },
    incomeTaxHeadline: { note: "Federal and provincial progressive income tax, together roughly 20–50% at the top brackets.", sourceUrl: "https://taxsummaries.pwc.com/canada/individual/taxes-on-personal-income" },
    vatRate: { value: 5, note: "Federal GST 5% plus provincial PST/HST (combined 13–15% in most provinces).", sourceUrl: "https://taxsummaries.pwc.com/quick-charts/value-added-tax-vat-rates" },
    keyCostNotes: [
      "High mobile and internet costs are a distinct line item compared with Europe.",
      "In big cities (Toronto, Vancouver) rent approaches US levels; smaller cities are noticeably cheaper.",
      "Public healthcare covers basics, but specialist waits can be long; private insurance speeds access.",
      "The climate adds heating and winter-clothing costs worth planning into the overall budget.",
    ],
    sources: [
      { label: "Numbeo Cost of Living Canada", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Canada", accessed: "2026-07" },
      { label: "Expatistan — Cost of Living in Toronto", url: "https://www.expatistan.com/cost-of-living/toronto", accessed: "2026-07" },
      { label: "PwC Canada — Personal Income Tax", url: "https://taxsummaries.pwc.com/canada/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
  "australia": {
    currency: "AUD",
    asOf: "2026-07",
    cities: [
      {
        city: "Canberra",
        tier: "capital",
        rent1brCenter: { local: [1700, 2400], usd: [1150, 1620] },
        rent1brOutside: { local: [1300, 1900], usd: [880, 1310] },
        rent3brCenter: { local: [2600, 3800], usd: [1750, 2560] },
        utilitiesBasic: { local: [150, 230], usd: [100, 155] },
        internet: { local: [70, 100], usd: [47, 68] },
        mobilePlan: { local: [40, 70], usd: [27, 48] },
        groceriesSingle: { local: [400, 550], usd: [270, 375] },
        mealInexpensive: { local: [20, 28], usd: [14, 19] },
        mealMidForTwo: { local: [90, 140], usd: [61, 95] },
        publicTransportPass: { local: [120, 160], usd: [81, 108] },
        monthlyBudgetSingle: { local: [900, 1300], usd: [610, 880] },
        monthlyBudgetFamily4: { local: [3100, 4100], usd: [2100, 2720] },
      },
      {
        city: "Sydney",
        tier: "major",
        rent1brCenter: { local: [2200, 3200], usd: [1480, 2150] },
        rent1brOutside: { local: [1700, 2500], usd: [1150, 1680] },
        rent3brCenter: { local: [3400, 4800], usd: [2290, 3230] },
        utilitiesBasic: { local: [170, 260], usd: [115, 175] },
        internet: { local: [70, 110], usd: [47, 75] },
        mobilePlan: { local: [45, 75], usd: [30, 51] },
        groceriesSingle: { local: [430, 600], usd: [290, 410] },
        mealInexpensive: { local: [22, 30], usd: [15, 20] },
        mealMidForTwo: { local: [100, 150], usd: [68, 102] },
        publicTransportPass: { local: [140, 190], usd: [94, 128] },
        monthlyBudgetSingle: { local: [950, 1400], usd: [640, 950] },
        monthlyBudgetFamily4: { local: [3300, 4400], usd: [2220, 2960] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 70, high: 180, note: "Private policies on top of Medicare; adult 30–45, mid-level cover including hospital." },
    costIndexVsUsa: { value: 85, basis: "USA = 100, excluding rent; Numbeo puts Australia close to the USA on day-to-day costs.", source: "Numbeo 2025/2026", sourceUrl: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Australia" },
    incomeTaxHeadline: { note: "Progressive income tax roughly 19–45% plus Medicare levy; residents taxed on worldwide income.", sourceUrl: "https://taxsummaries.pwc.com/australia/individual/taxes-on-personal-income" },
    vatRate: { value: 10, note: "GST at 10% on most goods and services.", sourceUrl: "https://taxsummaries.pwc.com/quick-charts/value-added-tax-vat-rates" },
    keyCostNotes: [
      "Sydney and Melbourne are much dearer on rent; Canberra and Adelaide give a more balanced budget.",
      "Groceries and eating out are expensive, especially in central areas; home cooking is the main saving.",
      "Private insurance is used for access to certain services and to cut public-system waits.",
      "Long distances and needing a car outside big cities raise the overall budget.",
    ],
    sources: [
      { label: "Numbeo Cost of Living Australia", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Australia", accessed: "2026-07" },
      { label: "Expatistan — Cost of Living in Sydney", url: "https://www.expatistan.com/cost-of-living/sydney", accessed: "2026-07" },
      { label: "PwC Australia — Personal Income Tax", url: "https://taxsummaries.pwc.com/australia/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
  "united-arab-emirates": {
    currency: "AED",
    asOf: "2026-07",
    cities: [
      {
        city: "Abu Dhabi",
        tier: "capital",
        rent1brCenter: { local: [4500, 7500], usd: [1225, 2040] },
        rent1brOutside: { local: [3500, 6000], usd: [950, 1635] },
        rent3brCenter: { local: [7500, 13000], usd: [2040, 3535] },
        utilitiesBasic: { local: [400, 700], usd: [110, 190] },
        internet: { local: [400, 600], usd: [110, 165] },
        mobilePlan: { local: [200, 350], usd: [55, 95] },
        groceriesSingle: { local: [1200, 1900], usd: [330, 520] },
        mealInexpensive: { local: [35, 60], usd: [10, 16] },
        mealMidForTwo: { local: [200, 350], usd: [55, 95] },
        publicTransportPass: { local: [150, 250], usd: [40, 70] },
        monthlyBudgetSingle: { local: [2200, 3200], usd: [600, 870] },
        monthlyBudgetFamily4: { local: [6000, 8200], usd: [1635, 2235] },
      },
      {
        city: "Dubai",
        tier: "popular_expat",
        rent1brCenter: { local: [5000, 9000], usd: [1360, 2450] },
        rent1brOutside: { local: [3800, 6500], usd: [1030, 1770] },
        rent3brCenter: { local: [8000, 14000], usd: [2180, 3820] },
        utilitiesBasic: { local: [450, 750], usd: [120, 205] },
        internet: { local: [450, 650], usd: [120, 180] },
        mobilePlan: { local: [220, 380], usd: [60, 105] },
        groceriesSingle: { local: [1300, 2100], usd: [355, 575] },
        mealInexpensive: { local: [40, 70], usd: [11, 19] },
        mealMidForTwo: { local: [220, 380], usd: [60, 105] },
        publicTransportPass: { local: [160, 280], usd: [44, 76] },
        monthlyBudgetSingle: { local: [2400, 3600], usd: [655, 980] },
        monthlyBudgetFamily4: { local: [6500, 9000], usd: [1770, 2450] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 80, high: 220, note: "Private/corporate insurance is mandatory; adult 30–45, UAE (sometimes global) coverage." },
    costIndexVsUsa: { value: 85, basis: "USA = 100, excluding rent; Numbeo and reviews put the UAE close to the USA on cost of living.", source: "Numbeo 2026", sourceUrl: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=United+Arab+Emirates" },
    incomeTaxHeadline: { note: "No income tax for most individuals; indirect taxes and fees apply.", sourceUrl: "https://taxsummaries.pwc.com/united-arab-emirates/individual/taxes-on-personal-income" },
    vatRate: { value: 5, note: "Standard VAT at 5% on most goods and services.", sourceUrl: "https://taxsummaries.pwc.com/united-arab-emirates/corporate/other-taxes" },
    keyCostNotes: [
      "Rent and international-school fees are the key budget drivers for expat families.",
      "Life without a car is impractical in most of Dubai; transport and car insurance add to the budget.",
      "Healthcare is fully paid and insurance-based; without adequate cover, hospital costs can be very high.",
      "Many employers provide housing and insurance, which radically changes the cost picture for salaried staff.",
    ],
    sources: [
      { label: "Numbeo Cost of Living UAE", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=United+Arab+Emirates", accessed: "2026-07" },
      { label: "Expatistan — Cost of Living in Dubai", url: "https://www.expatistan.com/cost-of-living/dubai", accessed: "2026-07" },
      { label: "PwC UAE — Individual Tax Summary", url: "https://taxsummaries.pwc.com/united-arab-emirates/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
  "estonia": {
    currency: "EUR",
    asOf: "2026-07",
    cities: [
      {
        city: "Tallinn",
        tier: "capital",
        rent1brCenter: { local: [700, 1100], usd: [800, 1260] },
        rent1brOutside: { local: [550, 900], usd: [630, 1030] },
        rent3brCenter: { local: [1200, 1800], usd: [1370, 2060] },
        utilitiesBasic: { local: [110, 170], usd: [126, 195] },
        internet: { local: [25, 35], usd: [29, 40] },
        mobilePlan: { local: [15, 25], usd: [17, 29] },
        groceriesSingle: { local: [220, 320], usd: [250, 365] },
        mealInexpensive: { local: [10, 14], usd: [11, 16] },
        mealMidForTwo: { local: [45, 70], usd: [52, 80] },
        publicTransportPass: { local: [30, 50], usd: [34, 57] },
        monthlyBudgetSingle: { local: [650, 900], usd: [750, 1040] },
        monthlyBudgetFamily4: { local: [2200, 2800], usd: [2520, 3200] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 40, high: 120, note: "Optional private top-ups on the public system; adult 30–45, basic coverage." },
    costIndexVsUsa: { value: 55, basis: "USA = 100, excluding rent; Estonia is markedly below the USA on day-to-day costs.", source: "Numbeo 2025/2026", sourceUrl: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Estonia" },
    incomeTaxHeadline: { note: "Flat income tax ~20% plus social contributions; residents taxed on worldwide income.", sourceUrl: "https://taxsummaries.pwc.com/estonia/individual/taxes-on-personal-income" },
    vatRate: { value: 20, note: "Standard VAT at 20%; reduced 9% rate on some goods and services.", sourceUrl: "https://taxsummaries.pwc.com/quick-charts/value-added-tax-vat-rates" },
    keyCostNotes: [
      "Rent in Tallinn is much higher than in other Estonian cities; digital nomads tend to pick central areas with better infrastructure.",
      "Groceries and eating out cost more than in neighbouring Latvia but less than in Finland.",
      "Healthcare is highly digitised; e-services cut transaction costs.",
      "Winter adds heating and cold-weather-clothing costs.",
    ],
    sources: [
      { label: "Numbeo Cost of Living Estonia", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Estonia", accessed: "2026-07" },
      { label: "PwC Estonia — Personal Income Tax", url: "https://taxsummaries.pwc.com/estonia/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
  "poland": {
    currency: "PLN",
    asOf: "2026-07",
    cities: [
      {
        city: "Warsaw",
        tier: "capital",
        rent1brCenter: { local: [3200, 4800], usd: [800, 1200] },
        rent1brOutside: { local: [2500, 3800], usd: [630, 950] },
        rent3brCenter: { local: [5200, 7500], usd: [1300, 1870] },
        utilitiesBasic: { local: [400, 650], usd: [100, 160] },
        internet: { local: [80, 120], usd: [20, 30] },
        mobilePlan: { local: [40, 80], usd: [10, 20] },
        groceriesSingle: { local: [900, 1300], usd: [225, 325] },
        mealInexpensive: { local: [35, 55], usd: [9, 14] },
        mealMidForTwo: { local: [160, 240], usd: [40, 60] },
        publicTransportPass: { local: [120, 160], usd: [30, 40] },
        monthlyBudgetSingle: { local: [900, 1300], usd: [225, 325] },
        monthlyBudgetFamily4: { local: [2800, 3800], usd: [700, 950] },
      },
      {
        city: "Krakow",
        tier: "popular_expat",
        rent1brCenter: { local: [2800, 4200], usd: [700, 1050] },
        rent1brOutside: { local: [2200, 3400], usd: [550, 850] },
        rent3brCenter: { local: [4800, 7000], usd: [1200, 1750] },
        utilitiesBasic: { local: [380, 600], usd: [95, 150] },
        internet: { local: [80, 110], usd: [20, 28] },
        mobilePlan: { local: [40, 80], usd: [10, 20] },
        groceriesSingle: { local: [850, 1200], usd: [210, 300] },
        mealInexpensive: { local: [30, 50], usd: [8, 13] },
        mealMidForTwo: { local: [150, 230], usd: [38, 58] },
        publicTransportPass: { local: [100, 150], usd: [25, 38] },
        monthlyBudgetSingle: { local: [850, 1200], usd: [210, 300] },
        monthlyBudgetFamily4: { local: [2600, 3600], usd: [650, 900] },
      },
    ],
    privateHealthInsuranceMonthUsd: { low: 40, high: 120, note: "Private packages on top of the public NFZ system; adult 30–45." },
    costIndexVsUsa: { value: 45, basis: "USA = 100, excluding rent; Numbeo puts Poland roughly 50–60% below the USA.", source: "Numbeo 2025/2026", sourceUrl: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Poland" },
    incomeTaxHeadline: { note: "Progressive income tax roughly 12–32% plus social contributions; residents taxed on worldwide income.", sourceUrl: "https://taxsummaries.pwc.com/poland/individual/taxes-on-personal-income" },
    vatRate: { value: 23, note: "Standard VAT at 23%; reduced 8% and 5% rates.", sourceUrl: "https://taxsummaries.pwc.com/quick-charts/value-added-tax-vat-rates" },
    keyCostNotes: [
      "Rent in Warsaw is noticeably higher than in other cities; Kraków and Wrocław are cheaper but popular with expats.",
      "Groceries and services are generally cheaper than in Western Europe; local markets and discounters save a lot.",
      "The public NFZ system can be overstretched; private insurance and clinics are popular with expats.",
      "The winter climate adds heating and clothing costs.",
    ],
    sources: [
      { label: "Numbeo Cost of Living Poland", url: "https://www.numbeo.com/cost-of-living/country_result.jsp?country=Poland", accessed: "2026-07" },
      { label: "Expatistan — Cost of Living in Warsaw", url: "https://www.expatistan.com/cost-of-living/warsaw", accessed: "2026-07" },
      { label: "PwC Poland — Personal Income Tax", url: "https://taxsummaries.pwc.com/poland/individual/taxes-on-personal-income", accessed: "2026-07" },
    ],
  },
};

export function costDetailForSlug(slug: string): CountryCost | null {
  return COST_DETAIL[slug] ?? null;
}

/** Slugs that have full researched cost detail (drives sitemap + cross-links). */
export function slugsWithCostDetail(): string[] {
  return Object.keys(COST_DETAIL);
}

/** e.g. "$500–$830" or "฿18,000–฿30,000". */
export function formatRange(
  [low, high]: [number, number],
  currency: string,
): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    THB: "฿",
    CHF: "CHF ",
    PLN: "zł ",
    SGD: "S$",
    BRL: "R$",
    MXN: "MX$",
    CAD: "CA$",
    AUD: "A$",
    NZD: "NZ$",
    INR: "₹",
    KRW: "₩",
    VND: "₫",
  };
  const sym = symbols[currency] ?? `${currency} `;
  const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
  return low === high
    ? `${sym}${fmt(low)}`
    : `${sym}${fmt(low)}–${sym}${fmt(high)}`;
}
