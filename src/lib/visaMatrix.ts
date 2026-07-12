// Server-side lookup over the Passport Index visa-requirement matrix
// (src/lib/visaMatrix.data.json, ~600KB — import this module ONLY from server
// code such as the generate route so the matrix never ships to the client).

import { normalizeName } from "./countryFacts";
import matrixJson from "./visaMatrix.data.json";

type VisaCode = number | "VF" | "VOA" | "EV" | "ETA" | "VR" | "NA";

interface VisaMatrixFile {
  source: string;
  updatedAt: string;
  matrix: Record<string, Record<string, VisaCode>>;
}

const FILE = matrixJson as VisaMatrixFile;

export interface VisaRequirement {
  /** Human label, e.g. "Visa-free · up to 90 days" or "Visa required". */
  label: string;
  /** Short machine category. */
  category: "visa-free" | "visa-on-arrival" | "e-visa" | "eta" | "visa-required" | "no-admission";
  /** Visa-free stay length in days, when known. */
  days: number | null;
  updatedAt: string;
}

// Dataset names occasionally differ from ours; normalize both sides once.
const INDEX: Record<string, Record<string, VisaCode>> = {};
for (const [origin, row] of Object.entries(FILE.matrix)) {
  const normRow: Record<string, VisaCode> = {};
  for (const [dest, code] of Object.entries(row)) {
    normRow[normalizeName(dest)] = code;
  }
  INDEX[normalizeName(origin)] = normRow;
}

function describe(code: VisaCode): Omit<VisaRequirement, "updatedAt"> {
  if (typeof code === "number") {
    return { label: `Visa-free · up to ${code} days`, category: "visa-free", days: code };
  }
  switch (code) {
    case "VF":
      return { label: "Visa-free", category: "visa-free", days: null };
    case "VOA":
      return { label: "Visa on arrival", category: "visa-on-arrival", days: null };
    case "EV":
      return { label: "e-Visa", category: "e-visa", days: null };
    case "ETA":
      return { label: "Electronic travel authorization (eTA)", category: "eta", days: null };
    case "NA":
      return { label: "No admission", category: "no-admission", days: null };
    default:
      return { label: "Visa required", category: "visa-required", days: null };
  }
}

/**
 * Tourist/short-stay visa requirement for a passport holder of `from`
 * entering `to`. Returns null when either country is not in the dataset.
 * Note: this reflects SHORT STAYS — long-term relocation always needs a
 * residence permit; the plan itself covers that.
 */
export function visaRequirementBetween(
  from: string,
  to: string,
): VisaRequirement | null {
  const row = INDEX[normalizeName(from)];
  if (!row) return null;
  const code = row[normalizeName(to)];
  if (code === undefined) return null;
  return { ...describe(code), updatedAt: FILE.updatedAt };
}

// Better categories rank higher; ties break on the longer visa-free stay.
const CATEGORY_RANK: Record<VisaRequirement["category"], number> = {
  "visa-free": 5,
  "visa-on-arrival": 4,
  eta: 3,
  "e-visa": 2,
  "visa-required": 1,
  "no-admission": 0,
};

/**
 * Best short-stay outcome across several passports (dual/multiple citizenship):
 * the strongest passport for THIS destination wins, so a mover isn't told they
 * need a visa when one of their other passports enters visa-free. Returns the
 * winning requirement tagged with the passport it came from.
 */
export function bestVisaRequirement(
  origins: string[],
  to: string,
): (VisaRequirement & { passport: string }) | null {
  let best: (VisaRequirement & { passport: string }) | null = null;
  for (const origin of origins) {
    const req = visaRequirementBetween(origin, to);
    if (!req) continue;
    const candidate = { ...req, passport: origin };
    if (
      !best ||
      CATEGORY_RANK[candidate.category] > CATEGORY_RANK[best.category] ||
      (CATEGORY_RANK[candidate.category] === CATEGORY_RANK[best.category] &&
        (candidate.days ?? 0) > (best.days ?? 0))
    ) {
      best = candidate;
    }
  }
  return best;
}
