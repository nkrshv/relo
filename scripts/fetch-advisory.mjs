// Offline batch fetcher for the Travel Advisory API (traveladvisory.io).
//
// WHY OFFLINE: the API free tier allows only 250 requests / month. Calling it
// per user request would exhaust the quota almost immediately. Instead we
// pre-fetch a compact snapshot for our curated destinations and commit it as
// src/lib/countryAdvisory.ts. The app reads that static snapshot (no live
// calls); this script is re-run periodically (see the monthly refresh
// automation) to keep the snapshot fresh.
//
// Usage: TRAVELADVISORY_API_KEY=... node scripts/fetch-advisory.mjs
//
// Cost: 3 requests per destination (advisory + traveler-impact +
// vaccinations). With ~18 destinations that is ~54 requests, so a full refresh
// fits several times over within the 250/month cap.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = "https://api.traveladvisory.io/v1";
const KEY = process.env.TRAVELADVISORY_API_KEY;

if (!KEY) {
  console.error("Missing TRAVELADVISORY_API_KEY environment variable.");
  process.exit(1);
}

// Derive the ISO 3166-1 alpha-2 code from a flag emoji (two regional indicator
// symbols). E.g. 🇵🇹 -> "PT".
function isoFromEmoji(emoji) {
  const cps = [...emoji].map((c) => c.codePointAt(0));
  if (cps.length < 2) return null;
  const base = 0x1f1e6;
  const a = cps[0] - base;
  const b = cps[1] - base;
  if (a < 0 || a > 25 || b < 0 || b > 25) return null;
  return String.fromCharCode(65 + a) + String.fromCharCode(65 + b);
}

// Parse the curated destination list out of src/lib/countries.ts so this script
// stays in sync with a single source of truth.
function loadDestinations() {
  const src = readFileSync(join(ROOT, "src/lib/countries.ts"), "utf8");
  const entries = [];
  const re = /\{\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*emoji:\s*"([^"]+)"\s*\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    entries.push({ slug: m[1], name: m[2], emoji: m[3] });
  }
  return entries;
}

async function getJson(path, attempt = 0) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const remaining = res.headers.get("x-ratelimit-remaining");
  if (res.status === 429 && attempt < 4) {
    console.log(`    per-minute limit hit, waiting 65s then retrying ${path}...`);
    await sleep(65000);
    return getJson(path, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`${path} -> HTTP ${res.status} (remaining: ${remaining})`);
  }
  return { data: await res.json(), remaining };
}

// Load already-fetched records from a JSON sidecar so re-runs skip countries
// we already have (saves monthly quota).
function loadExisting() {
  const p = join(ROOT, "src/lib/countryAdvisory.data.json");
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function s(v) {
  return typeof v === "string" ? v : "";
}
function arr(v) {
  return Array.isArray(v) ? v : [];
}

function buildVaccinations(vac) {
  const v = vac ?? {};
  const vaccine = (x) => ({
    name: s(x?.name),
    who: s(x?.who),
  });
  const malaria = v.malaria ?? {};
  return {
    required: arr(v.required).map(vaccine).filter((x) => x.name),
    recommended: arr(v.recommended).map(vaccine).filter((x) => x.name),
    routine: arr(v.routine).map(s).filter(Boolean),
    malaria: malaria.present
      ? {
          riskLevel: s(malaria.risk_level) || "unknown",
          medications: arr(malaria.medications).map(s).filter(Boolean),
        }
      : null,
    healthNotices: arr(v.health_notices)
      .map((n) => ({
        title: s(n?.title),
        level: s(n?.level),
        summary: s(n?.summary),
      }))
      .filter((n) => n.title),
  };
}

function buildRecord(name, flag, code, advisory, impact, vaccinations) {
  const a = advisory ?? {};
  const adv = a.advisory ?? {};
  const entry = a.entry_exit ?? {};
  const restr = a.restrictions ?? {};
  const cond = a.conditions ?? {};
  const ti = (impact && impact.traveler_impact) ?? {};
  const cs = (impact && impact.consular_support) ?? {};
  const sev = (impact && impact.severity) ?? {};

  const restrictionDetails = [];
  if (restr.movement_restrictions) restrictionDetails.push("Movement restrictions in effect");
  if (restr.curfew) restrictionDetails.push("Curfew in effect");
  if (restr.escort_required) restrictionDetails.push("Armed escort may be required");
  for (const d of arr(restr.details)) if (s(d)) restrictionDetails.push(s(d));

  const impactFor = (k) => ({
    level: s(ti[k]) || "unknown",
    detail: s(ti[`${k}_detail`]),
  });

  return {
    code,
    name,
    flag,
    level: typeof adv.level === "number" ? adv.level : 1,
    label: s(adv.label),
    headline: s(adv.headline),
    summaryPoints: arr(adv.summary_points).map(s).filter(Boolean).slice(0, 4),
    reasons: arr(adv.reasons).map(s).filter(Boolean),
    doNotTravel: arr(a.do_not_travel).map(s).filter(Boolean),
    restrictions: restrictionDetails,
    stateOfEmergency: Boolean(cond.state_of_emergency),
    entryExit: {
      visaRequired:
        typeof entry.visa_required === "boolean" ? entry.visa_required : null,
      currency: s(entry.currency),
      language: s(entry.language),
      notableRestrictions: arr(entry.notable_restrictions).map(s).filter(Boolean),
    },
    travelerImpact: {
      solo: impactFor("solo"),
      business: impactFor("business"),
      family: impactFor("family"),
      remote: impactFor("remote"),
    },
    consularSupport: {
      availability: s(cs.availability) || "unknown",
      evacuation: s(cs.evacuation) || "unknown",
      limited: Boolean(cs.limited_services || cs.emergency_services_limited),
    },
    severity: {
      crime: typeof sev.crime === "number" ? sev.crime : 0,
      terrorism: typeof sev.terrorism === "number" ? sev.terrorism : 0,
      kidnapping: typeof sev.kidnapping === "number" ? sev.kidnapping : 0,
      overall: typeof sev.overall === "number" ? sev.overall : 0,
    },
    vaccinations: buildVaccinations(vaccinations),
    stateDeptUrl: s(adv.state_dept_url),
    updatedAt: s(adv.updated_at),
    fetchedAt: new Date().toISOString().slice(0, 10),
  };
}

async function main() {
  const dests = loadDestinations();
  // --force refetches everything; otherwise resume, keeping already-fetched
  // countries to save monthly quota.
  const force = process.argv.includes("--force");
  console.log(`Fetching advisory data for ${dests.length} destinations...`);
  const records = force ? {} : loadExisting();
  let lastRemaining = "?";

  for (const d of dests) {
    const key = d.name.toLowerCase();
    const code = isoFromEmoji(d.emoji);
    if (!code) {
      console.warn(`  ! skip ${d.name}: could not derive ISO code`);
      continue;
    }
    const existing = !force ? records[key] : undefined;
    if (existing && existing.vaccinations) {
      console.log(`  · ${d.name} (cached, skip)`);
      continue;
    }
    try {
      if (existing) {
        // Record predates the vaccinations field: fetch only that endpoint
        // and merge, saving quota.
        const vac = await getJson(`/vaccinations?code=${code}`);
        lastRemaining = vac.remaining ?? lastRemaining;
        existing.vaccinations = buildVaccinations(vac.data);
        console.log(`  ✓ ${d.name} (${code}) vaccinations merged`);
        await sleep(7000); // 10 req/min cap -> ~1 request per 6s
        continue;
      }
      const advisory = await getJson(`/advisory?code=${code}`);
      await sleep(7000);
      const impact = await getJson(`/traveler-impact?code=${code}`);
      await sleep(7000);
      const vac = await getJson(`/vaccinations?code=${code}`);
      lastRemaining = vac.remaining ?? impact.remaining ?? lastRemaining;
      records[key] = buildRecord(
        d.name,
        d.emoji,
        code,
        advisory.data,
        impact.data,
        vac.data,
      );
      console.log(`  ✓ ${d.name} (${code}) level ${records[key].level}`);
      await sleep(7000);
    } catch (err) {
      console.error(`  ! ${d.name} (${code}): ${err.message}`);
    }
  }

  const header = `// AUTO-GENERATED by scripts/fetch-advisory.mjs — do not edit by hand.
// Source: U.S. State Department + CDC via traveladvisory.io.
// Regenerate with: TRAVELADVISORY_API_KEY=... node scripts/fetch-advisory.mjs
//
// This is a committed offline snapshot so the app never calls the rate-limited
// API (250 req/month) at request time.

export interface TravelerImpactEntry {
  level: string;
  detail: string;
}

export interface VaccineEntry {
  name: string;
  who: string;
}

export interface HealthNotice {
  title: string;
  level: string;
  summary: string;
}

export interface Vaccinations {
  required: VaccineEntry[];
  recommended: VaccineEntry[];
  routine: string[];
  malaria: { riskLevel: string; medications: string[] } | null;
  healthNotices: HealthNotice[];
}

export interface CountryAdvisory {
  code: string;
  name: string;
  flag: string;
  level: number;
  label: string;
  headline: string;
  summaryPoints: string[];
  reasons: string[];
  doNotTravel: string[];
  restrictions: string[];
  stateOfEmergency: boolean;
  entryExit: {
    visaRequired: boolean | null;
    currency: string;
    language: string;
    notableRestrictions: string[];
  };
  travelerImpact: {
    solo: TravelerImpactEntry;
    business: TravelerImpactEntry;
    family: TravelerImpactEntry;
    remote: TravelerImpactEntry;
  };
  consularSupport: {
    availability: string;
    evacuation: string;
    limited: boolean;
  };
  severity: {
    crime: number;
    terrorism: number;
    kidnapping: number;
    overall: number;
  };
  vaccinations: Vaccinations;
  stateDeptUrl: string;
  updatedAt: string;
  fetchedAt: string;
}

export const COUNTRY_ADVISORY: Record<string, CountryAdvisory> = ${JSON.stringify(records, null, 2)};
`;

  writeFileSync(
    join(ROOT, "src/lib/countryAdvisory.data.json"),
    JSON.stringify(records, null, 2),
  );
  writeFileSync(join(ROOT, "src/lib/countryAdvisory.generated.ts"), header);
  console.log(
    `\nWrote ${Object.keys(records).length} records to src/lib/countryAdvisory.generated.ts (quota remaining: ${lastRemaining})`,
  );
}

main();
