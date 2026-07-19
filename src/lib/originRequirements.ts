// Origin-country "get it while you are still a resident" credentials: things
// that are cheap or trivial to obtain at home but expensive or impossible
// after moving abroad (criminal-record certificates, international driving
// permits, e-government access tied to residency). Injected into the prompt
// for the ORIGIN side of the route, mirroring how COUNTRY_FACTS covers the
// destination side.
//
// Same conventions as countryFacts.ts: plain strings with the official root
// URL in "(https://domain/)" form, keyed by lowercased country name, aliases
// resolved via normalizeName(). Facts must be stable institutions; changing
// figures are phrased as approximate.

import { normalizeName } from "./countryFacts";

export const ORIGIN_REQUIREMENTS_VERIFIED = "2026-07";

export const ORIGIN_REQUIREMENTS: Record<string, string[]> = {
  netherlands: [
    "Criminal-record certificate is the VOG (Verklaring Omtrent het Gedrag), applied for via Justis (https://www.justis.nl/); from abroad the process is slower and needs extra identity checks, so request it before deregistering.",
    "International Driving Permit (IDP) is issued by the ANWB (https://www.anwb.nl/) at counters or online; it requires a valid Dutch licence and costs roughly \u20ac30.",
    "DigiD (https://www.digid.nl/) stays usable abroad only if it is set up with the app plus ID-check BEFORE leaving; after deregistration from the BRP, getting or recovering DigiD requires a counter visit at a limited set of embassies/desks.",
    "After deregistering from the BRP you keep an RNI (non-resident) registration; request certified BRP extracts you may need (birth/residence history) from the municipality before you leave.",
  ],
  germany: [
    "Criminal-record certificate is the F\u00fchrungszeugnis from the Bundesamt f\u00fcr Justiz (https://www.bundesjustizamt.de/); order it online with eID or at the B\u00fcrgeramt before Abmeldung.",
    "International Driving Permit is issued same-day by the local F\u00fchrerscheinstelle / B\u00fcrgeramt for roughly \u20ac15-20; it requires an in-person visit, so do it before departure.",
    "Keep access to ELSTER (https://www.elster.de/) for the final German tax return; the certificate file works from abroad, but registering a NEW account without a German address is much harder.",
    "Get the Abmeldebescheinigung (deregistration confirmation) when you deregister; German banks, insurers and the Finanzamt ask for it later and reissuing it from abroad is slow.",
  ],
  "united states": [
    "The FBI Identity History Summary (criminal-record check) (https://www.fbi.gov/) can be requested online with fingerprints; getting fingerprints taken to FBI standards abroad is harder, so do it before the move if the destination may ask for it.",
    "International Driving Permit is issued ONLY by AAA (https://www.aaa.com/) in person or by mail for ~$20; it cannot be issued once you no longer hold a US address easily.",
    "Set up online access to the IRS (https://www.irs.gov/) and your Social Security account (https://www.ssa.gov/) with a non-SMS second factor before leaving; US citizens keep filing US returns from abroad (citizenship-based taxation).",
  ],
  "united kingdom": [
    "Criminal-record certificate for visas is the ACRO Police Certificate (https://www.acro.police.uk/); apply online, roughly \u00a355-100, and allow several weeks.",
    "International Driving Permit is issued over the counter at PayPoint post offices for \u00a35.50; it requires a valid UK photocard licence, and you cannot get one after surrendering UK residency easily.",
    "Keep your Government Gateway / HMRC login (https://www.gov.uk/) with app-based 2FA; you need it for the P85 leaving-the-UK form and any final Self Assessment.",
  ],
  france: [
    "Criminal-record extract is the bulletin n\u00b03 from the Casier Judiciaire National (https://www.cjn.justice.gouv.fr/), free and available online; foreign authorities usually want it freshly issued, under 3-6 months old.",
    "International Driving Permit is requested online via ANTS (https://ants.gouv.fr/); processing can take weeks, so apply well before departure.",
    "Keep FranceConnect access (https://franceconnect.gouv.fr/) and impots.gouv.fr credentials for the final French tax return from abroad.",
  ],
  spain: [
    "Criminal-record certificate is the Certificado de Antecedentes Penales from the Ministerio de Justicia (https://www.mjusticia.gob.es/), available online with Cl@ve or digital certificate.",
    "International Driving Permit is issued by the DGT (https://www.dgt.es/) with a prior appointment (cita previa), ~\u20ac10; slots in big cities book out weeks ahead.",
    "Get or renew your Cl@ve / digital certificate (https://clave.gob.es/) before leaving; it keeps Spanish tax and social-security portals usable from abroad.",
  ],
  italy: [
    "Criminal-record certificate is the certificato del casellario giudiziale from the Procura della Repubblica (https://www.giustizia.it/); request it in person or via a delegate before leaving.",
    "International Driving Permit is issued by the Motorizzazione Civile (https://www.mit.gov.it/) with a marca da bollo; allow a few weeks.",
    "Activate SPID (https://www.spid.gov.it/) before departure: it is the key to INPS, Agenzia delle Entrate and consular services, and identity-proofing from abroad is much harder. Register with AIRE via your consulate after moving.",
  ],
  poland: [
    "Criminal-record certificate comes from the Krajowy Rejestr Karny (https://www.gov.pl/); order online with a Profil Zaufany or at a KRK information point.",
    "International Driving Permit is issued by the local starostwo powiatowe for ~35 z\u0142, usually same-day.",
    "Set up or keep your Profil Zaufany / mObywatel (https://www.gov.pl/) with app confirmation; it is needed for the final PIT return and civil-registry extracts from abroad.",
  ],
  russia: [
    "Criminal-record certificate (\u0441\u043f\u0440\u0430\u0432\u043a\u0430 \u043e\u0431 \u043e\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0438\u0438 \u0441\u0443\u0434\u0438\u043c\u043e\u0441\u0442\u0438) is ordered via Gosuslugi (https://www.gosuslugi.ru/) or MVD offices; from abroad it goes through consulates and takes much longer, so order fresh copies (and apostille them) before departure.",
    "International Driving Permit is issued same-day at many MFC centres for a small fee and requires an in-person visit.",
    "Keep Gosuslugi access with app-based confirmation and a non-Russian recovery email; SMS to a Russian number stops working once the SIM lapses, and many Russian banks and services depend on it.",
    "Order apostilled civil documents (birth/marriage certificates) and their duplicates from ZAGS before leaving; requesting them later via consulates takes months.",
  ],
  ukraine: [
    "Criminal-record certificate is available via the Diia portal (https://diia.gov.ua/) or MVS service centres; foreign authorities usually want it under 3-6 months old, so time it against your application.",
    "International Driving Permit is issued at MVS service centres (https://hsc.gov.ua/) same-day with a valid Ukrainian licence.",
    "Keep Diia app access and paper duplicates of civil documents; consular reissuing is slow, and some registries are harder to reach from abroad.",
  ],
  india: [
    "Police Clearance Certificate (PCC) is issued via Passport Seva (https://www.passportindia.gov.in/) from Passport Seva Kendra offices; from abroad it goes through embassies and takes far longer.",
    "International Driving Permit is issued by your RTO (https://parivahan.gov.in/) against a valid Indian licence; it requires an in-person or online application tied to your Indian address.",
    "Decide the fate of Aadhaar-linked mobile OTPs before leaving: most Indian government and bank logins use SMS OTP to an Indian number, so keep the Indian SIM alive on international roaming or switch services to app-based authentication.",
  ],
  brazil: [
    "Criminal-record certificate (certid\u00e3o de antecedentes criminais) is issued free online by the Pol\u00edcia Federal (https://www.gov.br/pf/); state-level certificates come from each state's civil police.",
    "International Driving Permit (PID) is requested from your state DETRAN (https://www.gov.br/) against a valid CNH.",
    "Keep your gov.br account at gold/silver level with app confirmation; it is the gateway to Receita Federal (income-tax exit declaration, the Comunica\u00e7\u00e3o de Sa\u00edda Definitiva) and to reissuing documents from abroad.",
  ],
  china: [
    "Certificate of No Criminal Record (\u65e0\u72af\u7f6a\u8bb0\u5f55\u8bc1\u660e) is issued by your local police/notary office and must usually be notarized (\u516c\u8bc1) for foreign use; arranging it from abroad requires a proxy with power of attorney.",
    "China does not issue Hague apostilles for documents predating its 2023 accession workflow in some offices; get key civil documents notarized and legalized/apostilled before departure.",
    "Keep your Chinese mobile number alive (many banks and Alipay/WeChat logins depend on SMS to it) or migrate what you can to app-based verification before leaving.",
  ],
  turkey: [
    "Criminal-record certificate (adli sicil kayd\u0131) is issued free online via e-Devlet (https://www.turkiye.gov.tr/).",
    "International Driving Permit is issued by the T\u00fcrkiye Touring and Automobile Club (https://www.turing.org.tr/).",
    "Keep e-Devlet access with app confirmation and a working recovery method; it is the gateway to almost every Turkish records request from abroad.",
  ],
  kazakhstan: [
    "Criminal-record certificate is issued via eGov.kz (https://egov.kz/) with EDS (digital signature) or at a CON (\u0426\u041e\u041d) service centre.",
    "Renew your EDS (\u042d\u0426\u041f) key before leaving: it expires periodically and reissuing it requires an in-person CON visit or a consulate.",
    "International Driving Permit is issued at CON service centres (\u0421\u043f\u0435\u0446\u0426\u041e\u041d) against a valid Kazakh licence.",
  ],
  portugal: [
    "Criminal-record certificate (certificado do registo criminal) is issued online via justica.gov.pt (https://justica.gov.pt/) with a Chave M\u00f3vel Digital or citizen card.",
    "Activate the Chave M\u00f3vel Digital (https://autenticacao.gov.pt/) before departure; it keeps Finan\u00e7as and Seguran\u00e7a Social portals usable from abroad.",
    "International Driving Permit is issued by the ACP (Autom\u00f3vel Club de Portugal) (https://www.acp.pt/) against a valid Portuguese licence.",
  ],
};

export function originRequirementsForCountry(country: string): string[] | null {
  return ORIGIN_REQUIREMENTS[normalizeName(country)] ?? null;
}
