// Relocation glossary: short, sourced definitions of the terms people search
// while planning a move ("what is a D7 visa", "what is an apostille"). Each
// entry carries a real definition, official source, and links into higher-
// intent country/plan pages — so pages are useful, not thin variable swaps.

export interface GlossarySource {
  label: string;
  url: string;
}

export interface GlossaryTerm {
  slug: string;
  term: string;
  // Extra query phrasings this entry also answers (used for on-page context,
  // not for extra routes).
  aliases?: string[];
  category: "visas" | "documents" | "taxes" | "us-taxes" | "registration";
  // One-sentence answer; used for meta description and the lead paragraph.
  short: string;
  // 1-3 short paragraphs of substance.
  body: string[];
  // Destination slugs this term is most relevant to (internal links).
  relatedCountries?: string[];
  // Other glossary slugs worth reading next.
  related?: string[];
  sources?: GlossarySource[];
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    slug: "digital-nomad-visa",
    term: "Digital nomad visa",
    aliases: ["remote work visa", "freelancer visa"],
    category: "visas",
    short:
      "A residence permit that lets you live in a country while working remotely for employers or clients based outside it, usually subject to a minimum income.",
    body: [
      "Digital nomad visas are aimed at remote workers and freelancers whose income comes from abroad. They typically require proof of steady income (a monthly or annual threshold), private health insurance, a clean criminal record, and sometimes a rental contract or accommodation proof.",
      "They differ from tourist entry (which forbids work) and from local work permits (which require a local employer). Terms, income floors and tax treatment vary widely by country, so the specific route matters more than the label.",
    ],
    relatedCountries: ["portugal", "spain", "estonia", "greece", "croatia"],
    related: ["golden-visa", "d7-visa", "tax-residency"],
  },
  {
    slug: "golden-visa",
    term: "Golden visa",
    aliases: ["residence by investment", "investor visa"],
    category: "visas",
    short:
      "A residence permit granted in exchange for a qualifying investment — commonly real estate, funds, or business — often with a low physical-presence requirement.",
    body: [
      "Golden visas trade capital for residence rights, and sometimes a path to citizenship. Qualifying investments and minimums differ by country and change frequently: several EU programs have been closed or narrowed, and real-estate options in particular have been curtailed.",
      "Because rules shift often, always confirm the current investment routes and amounts with the official immigration authority before committing.",
    ],
    relatedCountries: ["portugal", "spain", "greece", "malta"],
    related: ["digital-nomad-visa", "residence-permit", "tax-residency"],
  },
  {
    slug: "d7-visa",
    term: "D7 visa (Portugal)",
    aliases: ["passive income visa", "Portugal retirement visa"],
    category: "visas",
    short:
      "Portugal's residence visa for non-EU citizens with stable passive or remote income (pensions, rental, dividends, or remote work) sufficient to support themselves.",
    body: [
      "The D7 requires proof of regular income at least equal to the Portuguese minimum wage (more for dependants), proof of accommodation, and a Portuguese tax number (NIF) and bank account. It grants temporary residence that can be renewed and can lead to permanent residence.",
      "It is distinct from Portugal's digital-nomad (D8) route: the D7 is built around passive/stable income rather than an active remote job with a high salary threshold.",
    ],
    relatedCountries: ["portugal"],
    related: ["nif", "digital-nomad-visa", "tax-residency"],
    sources: [
      {
        label: "Portuguese immigration & borders (AIMA)",
        url: "https://aima.gov.pt/en",
      },
    ],
  },
  {
    slug: "apostille",
    term: "Apostille",
    aliases: ["Hague apostille", "document legalization"],
    category: "documents",
    short:
      "A certificate that authenticates a public document (birth certificate, degree, criminal record) for legal use in another country that is party to the 1961 Hague Convention.",
    body: [
      "An apostille is issued by a designated authority in the country where the document originated. It verifies the signature and seal on the document so a foreign authority will accept it without further legalization.",
      "Between Hague Convention members, an apostille replaces the older, slower consular-legalization chain. For non-member countries you may instead need embassy legalization. Documents often also need a certified translation.",
    ],
    related: ["residence-permit", "certificate-of-coverage"],
    sources: [
      {
        label: "HCCH — Apostille Section",
        url: "https://www.hcch.net/en/instruments/conventions/specialised-sections/apostille",
      },
    ],
  },
  {
    slug: "residence-permit",
    term: "Residence permit",
    aliases: ["residence card", "temporary residence"],
    category: "documents",
    short:
      "Official authorization to live in a country for longer than a short-stay visa allows, usually tied to a purpose such as work, study, family, or independent income.",
    body: [
      "A residence permit is what turns a long-stay visa into the right to actually settle: you typically enter on a national (long-stay) visa, then register locally and receive a residence card. Permits are usually renewable and can accumulate toward permanent residence.",
      "Requirements, validity and renewal rules are country-specific, and the permit's category (work, study, family, self-sufficient) determines what you may and may not do.",
    ],
    related: ["digital-nomad-visa", "golden-visa", "tax-residency"],
  },
  {
    slug: "tax-residency",
    term: "Tax residency (183-day rule)",
    aliases: ["tax resident", "183 day rule"],
    category: "taxes",
    short:
      "The status that determines which country can tax your worldwide income — often triggered by spending 183+ days there in a year, though other tests apply too.",
    body: [
      "Many countries treat you as a tax resident if you spend at least 183 days there in a tax year, but that is not the only test: a permanent home, your centre of vital interests (family, economic ties), or habitual abode can each make you resident even below 183 days.",
      "You can be tax-resident in more than one country at once; tax treaties contain 'tie-breaker' rules to decide which one prevails. This is general information, not personal tax advice — your situation depends on treaties and local law.",
    ],
    related: ["totalization-agreement", "feie", "residence-permit"],
  },
  {
    slug: "feie",
    term: "FEIE (Foreign Earned Income Exclusion)",
    aliases: ["foreign earned income exclusion", "form 2555"],
    category: "us-taxes",
    short:
      "A U.S. tax provision letting qualifying Americans abroad exclude a capped amount of foreign earned income from U.S. federal income tax.",
    body: [
      "U.S. citizens and green-card holders are taxed on worldwide income no matter where they live. The FEIE (claimed on Form 2555) lets those who meet the bona fide residence or physical presence test exclude foreign earned income up to an annually adjusted limit.",
      "It applies to earned income (wages, self-employment), not passive income, and it does not remove the requirement to file a U.S. return. It is often combined with the Foreign Tax Credit.",
    ],
    related: ["fbar", "fatca", "totalization-agreement", "tax-residency"],
    sources: [
      {
        label: "IRS — Foreign Earned Income Exclusion",
        url: "https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion",
      },
    ],
  },
  {
    slug: "fbar",
    term: "FBAR (Report of Foreign Bank and Financial Accounts)",
    aliases: ["FinCEN Form 114", "foreign account report"],
    category: "us-taxes",
    short:
      "An annual U.S. report (FinCEN Form 114) required when the total of your non-U.S. financial accounts exceeds $10,000 at any point in the year.",
    body: [
      "The FBAR is filed with FinCEN, separately from your tax return, if the aggregate value of your foreign accounts crosses $10,000 at any time during the calendar year. It is informational — it reports account existence, not income — but penalties for not filing can be steep.",
      "It is distinct from FATCA reporting (Form 8938), though both may apply. Many U.S. expats owe no extra tax but still must file the FBAR.",
    ],
    related: ["fatca", "feie", "tax-residency"],
    sources: [
      {
        label: "FinCEN — Report Foreign Bank and Financial Accounts",
        url: "https://bsaefiling.fincen.treas.gov/main.html",
      },
    ],
  },
  {
    slug: "fatca",
    term: "FATCA (Foreign Account Tax Compliance Act)",
    aliases: ["form 8938", "foreign financial assets"],
    category: "us-taxes",
    short:
      "A U.S. law requiring foreign financial institutions to report accounts held by U.S. persons, and requiring those persons to report specified foreign assets above thresholds.",
    body: [
      "FATCA pushes non-U.S. banks to identify and report U.S. account holders to the IRS, which is why some foreign banks are reluctant to open accounts for Americans. U.S. persons above the asset thresholds also file Form 8938 with their return.",
      "FATCA reporting (Form 8938) and the FBAR (FinCEN 114) overlap but have different thresholds and are filed separately, so many expats file both.",
    ],
    related: ["fbar", "feie", "totalization-agreement"],
    sources: [
      {
        label: "IRS — FATCA",
        url: "https://www.irs.gov/businesses/corporations/foreign-account-tax-compliance-act-fatca",
      },
    ],
  },
  {
    slug: "totalization-agreement",
    term: "Totalization agreement",
    aliases: ["social security agreement", "certificate of coverage"],
    category: "us-taxes",
    short:
      "A bilateral agreement that stops you paying social-security taxes to two countries at once and lets you combine work credits across both.",
    body: [
      "Without a totalization agreement, an American working abroad can owe social-security contributions in both the U.S. and the host country on the same earnings. These agreements assign coverage to one system and let periods of coverage be combined toward benefits.",
      "Where an agreement exists, you obtain a certificate of coverage to prove which country's system you contribute to. Where none exists, double social-contribution exposure is common.",
    ],
    related: ["certificate-of-coverage", "feie", "tax-residency"],
    sources: [
      {
        label: "U.S. SSA — International Agreements",
        url: "https://www.ssa.gov/international/agreements_overview.html",
      },
    ],
  },
  {
    slug: "certificate-of-coverage",
    term: "Certificate of coverage",
    category: "us-taxes",
    short:
      "A document proving you pay social-security contributions in one country under a totalization agreement, so the other country exempts you.",
    body: [
      "Under a totalization agreement, a certificate of coverage is the paperwork that proves which country's social-security system you belong to. Employees and the self-employed use it to avoid being charged contributions twice on the same income.",
      "You request it from the country whose system covers you (for the U.S., via the SSA). Keep it on hand — the host country's authorities may ask for it.",
    ],
    related: ["totalization-agreement", "apostille"],
    sources: [
      {
        label: "U.S. SSA — International Agreements",
        url: "https://www.ssa.gov/international/agreements_overview.html",
      },
    ],
  },
  {
    slug: "nif",
    term: "NIF (Portuguese tax number)",
    aliases: ["número de identificação fiscal", "Portugal tax number"],
    category: "registration",
    short:
      "Portugal's tax identification number, needed for almost everything: opening a bank account, signing a lease, getting utilities, or applying for a visa.",
    body: [
      "The NIF (Número de Identificação Fiscal) is issued by the Portuguese tax authority. Non-residents can obtain one, often through a fiscal representative, and it is usually one of the first things to arrange when moving to or investing in Portugal.",
      "It is not a residence permit — it is purely a tax ID — but without it most administrative and financial steps are blocked.",
    ],
    relatedCountries: ["portugal"],
    related: ["nie", "d7-visa", "tax-residency"],
    sources: [
      {
        label: "Portugal tax & customs authority",
        url: "https://info.portaldasfinancas.gov.pt/",
      },
    ],
  },
  {
    slug: "nie",
    term: "NIE (Spanish foreigner ID number)",
    aliases: ["número de identidad de extranjero", "Spain foreigner number"],
    category: "registration",
    short:
      "Spain's identification number for foreigners, required to work, open a bank account, buy property, or handle most official paperwork.",
    body: [
      "The NIE (Número de Identidad de Extranjero) is a unique number assigned to non-Spaniards for tax and legal purposes. You typically apply at a police station or Spanish consulate, showing a reason for needing it.",
      "The NIE is a number; the TIE (Tarjeta de Identidad de Extranjero) is the physical residence card that non-EU residents receive. They are related but not the same thing.",
    ],
    relatedCountries: ["spain"],
    related: ["nif", "padron", "residence-permit"],
  },
  {
    slug: "padron",
    term: "Padrón (empadronamiento, Spain)",
    aliases: ["empadronamiento", "town hall registration"],
    category: "registration",
    short:
      "Registration on your local town-hall census in Spain, proving where you live and unlocking healthcare, school enrolment and many administrative steps.",
    body: [
      "The certificado de empadronamiento is issued by your municipality when you register your address. It is used to prove residence for healthcare registration, school places, residency renewals and more.",
      "Registering is generally free and quick, usually needing your passport/NIE and proof of address such as a rental contract or utility bill.",
    ],
    relatedCountries: ["spain"],
    related: ["nie", "anmeldung", "residence-permit"],
  },
  {
    slug: "anmeldung",
    term: "Anmeldung (Germany address registration)",
    aliases: ["Meldebescheinigung", "Germany registration"],
    category: "registration",
    short:
      "Mandatory registration of your address at the local citizens' office in Germany, usually required within about two weeks of moving in.",
    body: [
      "The Anmeldung registers your residence at the Bürgeramt and produces a Meldebescheinigung (registration certificate). It is a prerequisite for a tax ID, a bank account, a phone contract and residence-permit steps.",
      "You typically need your passport, a rental contract and a landlord confirmation (Wohnungsgeberbestätigung). Appointments can be scarce in big cities, so book early.",
    ],
    relatedCountries: ["germany"],
    related: ["padron", "residence-permit", "tax-residency"],
  },
];

export const GLOSSARY_VERIFIED = "2026-07";

export function glossaryTermForSlug(slug: string): GlossaryTerm | null {
  return GLOSSARY.find((t) => t.slug === slug) ?? null;
}

export function allGlossarySlugs(): string[] {
  return GLOSSARY.map((t) => t.slug);
}
