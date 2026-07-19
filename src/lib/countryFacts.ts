// Curated, verified reference facts per destination country.
//
// These are injected into the generation prompt and explicitly override the
// model's training data (which is often stale — e.g. Portugal's SEF was
// dissolved in Oct 2023 and replaced by AIMA). Keep facts to stable,
// well-established institutions, portals and systems. Where a figure changes
// yearly (income thresholds, fees), phrase it as approximate and instruct the
// model to tell the user to verify the current number on the official site.
//
// Keyed by the lowercased destination name. Aliases are normalized in
// factsForCountry().

// Each fact may include the OFFICIAL root URL for the institution/portal it
// names, in the form "(https://domain/)". These are the domains the model
// should use for the item "url" field — they override the model's own guesses.
// When this table was last reviewed against official sources, YYYY-MM.
// Surfaced in the prompt so generated advice can qualify time-sensitive
// figures ("verified as of ..."), and as a maintenance reminder here.
export const COUNTRY_FACTS_VERIFIED = "2026-06";

export const COUNTRY_FACTS: Record<string, string[]> = {
  portugal: [
    "Immigration/residency authority is AIMA (Agência para a Integração, Migrações e Asilo) (https://aima.gov.pt/) — it REPLACED SEF in October 2023. Never refer to SEF as current, and never link to acm.gov.pt for residency.",
    "Tax number is the NIF, issued by Finanças / Autoridade Tributária (https://www.portaldasfinancas.gov.pt/); non-EU residents typically need a fiscal representative to get it.",
    "Social security number is the NISS, from Segurança Social (https://www.seg-social.pt/); public healthcare is the SNS (https://www.sns.gov.pt/), registered at your local Centro de Saúde / Unidade de Saúde Familiar.",
    "Common visa routes: D7 (passive/retirement income) and D8 Digital Nomad visa, applied for at the Portuguese consulate (https://portaldascomunidades.mne.gov.pt/); D7 requires stable passive income roughly at/above the national minimum wage — tell the user to verify the current figure.",
    "Main housing portals: Idealista (https://www.idealista.pt/), Imovirtual (https://www.imovirtual.com/), OLX. Emergency number is 112.",
    "Key figures (approximate — tell the user to verify current values): national minimum wage ~€870/month (2025); D8 digital nomad visa requires income around 4× the minimum wage (~€3,480/month); getting a NIF via a fiscal representative typically costs ~€100–200; landlords commonly ask for 2 months' rent as deposit plus 1 month upfront.",
  ],
  spain: [
    "Foreigner ID number is the NIE; residence card is the TIE, handled via Extranjería / Oficina de Extranjeros (https://www.inclusion.gob.es/) and Policía Nacional.",
    "You must register your address (empadronamiento / padrón) at the local Ayuntamiento — it's needed for many other procedures.",
    "Tax authority is the Agencia Tributaria / AEAT (https://sede.agenciatributaria.gob.es/); public healthcare and social security run through the Seguridad Social (https://www.seg-social.es/) with a tarjeta sanitaria.",
    "Spain launched a Digital Nomad Visa under the 2023 Startups Law. Main housing portals: Idealista (https://www.idealista.com/), Fotocasa (https://www.fotocasa.es/). Emergency number is 112.",
    "Key figures (approximate — verify current values): the Digital Nomad Visa requires income around 200% of the SMI (~€2,700–2,800/month); the NIE application fee (form/tasa 790-012) is roughly €10–17; rental deposits are legally 1 month (fianza) but landlords often ask 1–2 months extra guarantee; empadronamiento at the Ayuntamiento is free.",
  ],
  germany: [
    "You MUST do the Anmeldung (address registration) at the local Bürgeramt, usually within 14 days of moving in — almost everything (bank, tax ID, contracts) depends on it.",
    "Residence permits are issued by the Ausländerbehörde; skilled workers often use the EU Blue Card (https://www.make-it-in-germany.com/).",
    "Tax ID (Steuer-Identifikationsnummer) is mailed automatically after Anmeldung; the tax office is the Finanzamt (https://www.elster.de/).",
    "Health insurance is mandatory — public (gesetzliche, e.g. TK, AOK, Barmer) or private; proof is needed for many steps.",
    "Renting usually requires a SCHUFA credit report and often a Mietschuldenfreiheitsbescheinigung. Portals: ImmoScout24 (https://www.immobilienscout24.de/), WG-Gesucht (https://www.wg-gesucht.de/), Immowelt. Emergency number is 112.",
    "Key figures (approximate — verify current values): Anmeldung is free but big-city Bürgeramt slots book out weeks ahead; the EU Blue Card salary threshold is ~€48,300/year (2025, lower ~€43,760 for shortage occupations); students need a blocked account (Sperrkonto) of ~€11,904/year; public health insurance costs ~14.6% of income plus an insurer surcharge; rental deposits are legally capped at 3 months' cold rent (Kaltmiete).",
  ],
  netherlands: [
    "You register at the municipality (gemeente) to get a BSN (citizen service number) — required for work, banking and healthcare; then set up a DigiD login (https://www.digid.nl/).",
    "Residence permits are handled by the IND (https://ind.nl/); tax authority is the Belastingdienst (https://www.belastingdienst.nl/).",
    "Dutch health insurance (basisverzekering) is mandatory and must be taken out within 4 months of getting a residence permit; skilled migrants may qualify for the 30% ruling.",
    "Main housing portals: Funda (https://www.funda.nl/), Pararius (https://www.pararius.com/), Kamernet. Emergency number is 112.",
    "Key figures (approximate — verify current values): basic health insurance (basisverzekering) costs ~€140–160/month per adult; the 30% ruling requires a taxable salary around €46,000–47,000/year (lower for under-30s with a master's); an IND residence permit application costs roughly €350–400; rental deposits are typically 1–2 months.",
  ],
  france: [
    "A long-stay visa (VLS-TS) must be validated online with OFII (https://administration-etrangers-en-france.interieur.gouv.fr/) shortly after arrival; longer term you get a carte de séjour from the préfecture.",
    "Tax is handled via impots.gouv.fr (https://www.impots.gouv.fr/) with a numéro fiscal; healthcare is Assurance Maladie (https://www.ameli.fr/) with a carte Vitale, generally after ~3 months of stable residence.",
    "Opening a bank account and renting require a justificatif de domicile; rentals often need a French guarantor or a Visale guarantee (https://www.visale.fr/).",
    "Main housing portals: LeBonCoin (https://www.leboncoin.fr/), SeLoger (https://www.seloger.com/), PAP. Emergency number is 112.",
    "Key figures (approximate — verify current values): validating the VLS-TS online costs a €200 tax (timbre fiscal); the carte Vitale generally requires ~3 months of stable residence before Assurance Maladie affiliation; unfurnished rental deposits are capped at 1 month's rent (2 months furnished).",
  ],
  italy: [
    "Apply for the permesso di soggiorno within 8 days of arrival — pick up the kit at a Poste Italiane Sportello Amico, then attend the Questura (https://questure.poliziadistato.it/).",
    "Codice fiscale (tax code) comes from the Agenzia delle Entrate (https://www.agenziaentrate.gov.it/); register your residence (residenza) at the Comune's Anagrafe office.",
    "Public healthcare is the SSN with a tessera sanitaria. Italy introduced a Digital Nomad Visa in 2024.",
    "Main housing portals: Immobiliare.it (https://www.immobiliare.it/), Idealista (https://www.idealista.it/), Casa.it. Emergency number is 112.",
    "Key figures (approximate — verify current values): the permesso di soggiorno costs ~€100–130 all-in (electronic permit fee €70–100 + €30 kit postage + €16 marca da bollo stamp) and must be applied for within 8 working days of arrival; the codice fiscale is free at Agenzia delle Entrate; rental deposits are typically 2–3 months.",
  ],
  ireland: [
    "Register your immigration permission and get an IRP via the ISD immigration service (https://www.irishimmigration.ie/); a PPS number comes from the Department of Social Protection (https://www.mywelfare.ie/).",
    "Tax is handled by Revenue (https://www.revenue.ie/); social insurance is PRSI. Register with a GP for healthcare.",
    "Housing is very tight — Daft.ie (https://www.daft.ie/) is the main portal; expect strong competition and to provide references. Emergency numbers are 112 and 999.",
    "Key figures (approximate — verify current values): IRP registration costs €300 per person; the PPS number is free via MyWelfare; Dublin one-bed rents commonly run €1,800–2,200+/month and deposits are typically 1–2 months; GP visits cost ~€60–80 without a medical card.",
  ],
  "united kingdom": [
    "Immigration is via UKVI / Home Office (https://www.gov.uk/browse/visas-immigration); physical BRP cards were phased out in favour of a digital eVisa (UKVI account) by 2025.",
    "You pay the Immigration Health Surcharge (IHS) with your visa, which gives NHS access — register with a local GP (https://www.nhs.uk/); also apply for a National Insurance (NI) number.",
    "Tax authority is HMRC (https://www.gov.uk/government/organisations/hm-revenue-customs). Landlords must do a Right to Rent check. Main housing portals: Rightmove (https://www.rightmove.co.uk/), Zoopla (https://www.zoopla.co.uk/), OpenRent. Emergency numbers are 999 and 112.",
    "Key figures (approximate — verify current values): the Immigration Health Surcharge is £1,035/year per adult (£776 for students/under-18s), paid upfront for the whole visa length; the Skilled Worker general salary threshold is ~£38,700/year; tenancy deposits are legally capped at 5 weeks' rent (annual rent under £50k).",
  ],
  "united states": [
    "Immigration/visas run through USCIS (https://www.uscis.gov/); get a Social Security Number (SSN) from the SSA (https://www.ssa.gov/), or an ITIN from the IRS (https://www.irs.gov/) if you're not SSN-eligible but must file taxes.",
    "There is NO national health system — you need private or employer-sponsored health insurance; medical costs are very high without it.",
    "You start with no US credit history, which complicates renting and getting cards; a secured card or SSN-linked history helps.",
    "Main housing portals: Zillow (https://www.zillow.com/), Apartments.com (https://www.apartments.com/), Trulia. Emergency number is 911.",
    "Key figures (approximate — verify current values): the SSN is free from the SSA; landlords typically want first month + security deposit (often 1 month) and proof of income at 2.5–3× the rent; without US credit history a secured credit card usually needs a $200–500 refundable deposit; marketplace health plans (healthcare.gov) commonly run $400–600+/month per adult without subsidies.",
  ],
  canada: [
    "Immigration is via IRCC (https://www.canada.ca/en/immigration-refugees-citizenship.html); get a Social Insurance Number (SIN) from Service Canada (https://www.canada.ca/en/employment-social-development/services/sin.html).",
    "Healthcare is provincial (e.g. OHIP in Ontario, MSP in BC, RAMQ in Quebec) and can have a waiting period of up to ~3 months — buy private interim insurance to cover the gap.",
    "Tax authority is the CRA (https://www.canada.ca/en/revenue-agency.html). Main housing portals: Realtor.ca (https://www.realtor.ca/), Rentals.ca (https://rentals.ca/), Kijiji. Emergency number is 911.",
    "Key figures (approximate — verify current values): the SIN is free and issued same-day at Service Canada; provincial health coverage can have up to a ~3-month waiting period (e.g. BC) — interim private insurance costs ~CAD 50–100/month; rental deposits vary by province (e.g. Ontario: first + last month's rent; BC: half a month security deposit).",
  ],
  australia: [
    "Visas are issued by the Department of Home Affairs (https://immi.homeaffairs.gov.au/) (common subclasses include 189/190 skilled, 482 employer-sponsored, 500 student).",
    "Get a Tax File Number (TFN) from the ATO (https://www.ato.gov.au/); employers pay superannuation. Medicare (https://www.servicesaustralia.gov.au/medicare) covers eligible migrants; otherwise you need OSHC/OVHC private cover.",
    "Main housing portals: realestate.com.au (https://www.realestate.com.au/), Domain (https://www.domain.com.au/). Emergency number is 000.",
    "Key figures (approximate — verify current values): the TFN is free from the ATO; rental bonds are typically 4 weeks' rent lodged with the state bond authority; OSHC student cover runs ~AUD 500–700/year single; the Medicare levy is 2% of taxable income for those covered.",
  ],
  "united arab emirates": [
    "You need a residence visa plus an Emirates ID, processed via the ICP (https://icp.gov.ae/) (federal) or GDRFA (https://www.gdrfad.gov.ae/) (Dubai); most people are sponsored by an employer, or use freelance/Golden visa routes.",
    "There is no personal income tax. Health insurance is mandatory — regulated by the DHA in Dubai and DoH in Abu Dhabi.",
    "Foreign documents (degrees, marriage certificates) usually need attestation up to UAE MOFA. Rentals must be registered via Ejari (Dubai).",
    "Main housing portals: Bayut (https://www.bayut.com/), Property Finder (https://www.propertyfinder.ae/), Dubizzle. Emergency numbers are 999 and 112.",
    "Key figures (approximate — verify current values): a 2-year residence visa + Emirates ID typically costs AED 1,000–3,000 in government fees (employer usually pays); Ejari tenancy registration is ~AED 220; the DEWA utilities deposit is AED 2,000 for an apartment (AED 4,000 villa); Dubai rent is often paid in 1–4 post-dated cheques, and fewer cheques usually means a better price; agency fee is typically 5% of annual rent.",
  ],
  estonia: [
    "IMPORTANT: e-Residency (https://www.e-resident.gov.ee/) is NOT a residence permit and gives no right to live in Estonia — don't conflate them. Actual residence permits come from the Police and Border Guard Board / PPA (https://www.politsei.ee/).",
    "Your personal ID code is the isikukood; Estonia offers a Digital Nomad Visa. Tax authority is the Tax and Customs Board / EMTA (https://www.emta.ee/).",
    "Health insurance runs through the Health Insurance Fund (Tervisekassa) (https://www.tervisekassa.ee/). Main housing portals: kv.ee (https://www.kv.ee/), city24. Emergency number is 112.",
    "Key figures (approximate — verify current values): the Digital Nomad Visa requires gross income of ~€3,500/month over the preceding 6 months; long-stay (D) visa state fee is ~€100 and temporary residence permit ~€160; rental deposits are typically 1 month.",
  ],
  poland: [
    "Residence cards (karta pobytu) are issued by the regional Voivodeship Office (Urząd Wojewódzki); you also need a PESEL number. Official info: (https://www.gov.pl/web/udsc).",
    "Tax ID for foreigners is often the PESEL or a NIP via the Urząd Skarbowy; healthcare is via NFZ (https://www.nfz.gov.pl/) and social contributions via ZUS (https://www.zus.pl/).",
    "Main housing portals: Otodom (https://www.otodom.pl/), OLX (https://www.olx.pl/). Emergency number is 112.",
    "Key figures (approximate — verify current values): a temporary residence permit (karta pobytu) costs PLN 340 stamp duty + PLN 100 for the card, and processing at the Urząd Wojewódzki routinely takes 6–12+ months (you stay legal on the stamp in your passport); voluntary NFZ health contribution is ~9% of declared income; rental deposits are typically 1–2 months.",
  ],
  mexico: [
    "Temporary/Permanent Resident visas must be STARTED at a Mexican consulate abroad, then completed (canje) at an INM office (https://www.gob.mx/inm) in Mexico within 30 days of arrival — you cannot do the whole thing inside Mexico.",
    "You'll get a CURP (population ID) and, for tax, an RFC from SAT (https://www.sat.gob.mx/); public healthcare options include IMSS, but many expats use private insurance.",
    "Temporary residency requires proof of economic solvency (income or savings) — tell the user to verify current thresholds with the consulate.",
    "Main housing portals: Inmuebles24 (https://www.inmuebles24.com/), Vivanuncios, Lamudi. Emergency number is 911.",
    "Key figures (approximate — verify with the specific consulate, thresholds vary and change yearly): temporary residency solvency is commonly ~US$4,000–4,500/month income over 6 months OR ~US$70,000 in savings/investments over 12 months; the consular visa fee is ~US$50–55 and the INM canje card fee ~MXN 5,000–6,000; landlords often require a fiador (local guarantor) or a póliza jurídica (~1 month's rent).",
  ],
  thailand: [
    "Foreigners use Non-Immigrant visas; newer options are the LTR (Long-Term Resident) visa (https://ltr.boi.go.th/) and the DTV (Destination Thailand Visa, 2024) aimed at remote workers.",
    "Report your address every 90 days to the Immigration Bureau (https://www.immigration.go.th/) (90-day report); landlords/hosts file a TM30. Working requires a work permit via the Ministry of Labour.",
    "There is no free public healthcare for foreigners — private insurance is essential. Main housing portals: DDproperty (https://www.ddproperty.com/), Hipflat. Emergency 191 (police), 1155 (tourist police).",
    "Key figures (approximate — verify current values): the DTV costs THB 10,000 and requires proof of ~THB 500,000 in funds; the LTR visa requires ~US$80,000/year income (lower with investment); the retirement (O-A/O) route needs THB 800,000 in a Thai bank or THB 65,000/month income; late 90-day reports are fined THB 2,000; condo deposits are typically 2 months + 1 month advance rent.",
  ],
  japan: [
    "You receive a Residence Card (Zairyu Card) on arrival; you must register your address at the municipal (city/ward) office within 14 days, which also enrolls you for a My Number. Immigration: (https://www.isa.go.jp/).",
    "Enroll in National Health Insurance (Kokumin Kenko Hoken) at the municipal office and the pension system (Nenkin).",
    "Renting often requires key money (reikin), a deposit, and a guarantor or guarantor company. Main housing portals: Suumo (https://suumo.jp/), GaijinPot (https://apartments.gaijinpot.com/), At Home. Emergency 110 (police), 119 (ambulance/fire).",
    "Key figures (approximate — verify current values): move-in costs typically total 4–6 months' rent (deposit/shikikin 1–2 months + key money/reikin 0–2 months + agency fee ~1 month + guarantor company ~0.5–1 month); National Health Insurance premiums are income-based (roughly ¥1,500–2,000/month minimum for low income, much more with salary); address registration and My Number enrolment at the ward office must happen within 14 days.",
  ],
  singapore: [
    "There is no self-sponsored residence — you need an employer-sponsored pass from MOM (https://www.mom.gov.sg/) (Employment Pass, S Pass, or work permit); EP has a minimum salary threshold, so verify the current figure with MOM.",
    "Set up SingPass (https://www.singpass.gov.sg/) for government services; tax authority is IRAS (https://www.iras.gov.sg/). CPF applies to citizens and PRs, not pass holders.",
    "Healthcare is largely private/employer-provided for foreigners. Main housing portals: PropertyGuru (https://www.propertyguru.com.sg/), 99.co (https://www.99.co/). Emergency 999 (police), 995 (ambulance/fire).",
    "Key figures (approximate — verify current values): the Employment Pass minimum qualifying salary is ~SGD 5,600/month (higher in financial services, and rises with age) plus the COMPASS points test; EP application fee is ~SGD 105 + ~SGD 225 issuance; rental deposits are typically 1 month per year of lease; agent fee is commonly half to one month.",
  ],
};

const ALIASES: Record<string, string> = {
  usa: "united states",
  us: "united states",
  "u.s.": "united states",
  "u.s.a.": "united states",
  america: "united states",
  uk: "united kingdom",
  "u.k.": "united kingdom",
  britain: "united kingdom",
  "great britain": "united kingdom",
  england: "united kingdom",
  uae: "united arab emirates",
  emirates: "united arab emirates",
  dubai: "united arab emirates",
  holland: "netherlands",
};

export function normalizeName(country: string): string {
  const c = country.trim().toLowerCase();
  return ALIASES[c] ?? c;
}

// Returns curated facts for a destination, or null if we have none.
export function factsForCountry(country: string): string[] | null {
  return COUNTRY_FACTS[normalizeName(country)] ?? null;
}
