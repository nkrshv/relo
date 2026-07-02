// Offline fetcher for the origin -> destination visa-requirement matrix.
//
// Source: Passport Index dataset (https://github.com/ilyankou/passport-index-dataset),
// an open, regularly-updated 199x199 matrix scraped from passportindex.org.
// No API key or rate limit: it's a single CSV download. We compact it into
// src/lib/visaMatrix.data.json (short codes) and read it SERVER-SIDE only
// (in the generate route) so the ~200KB matrix never ships to the client.
//
// Codes: a number = visa-free stay in days; "VF" = visa free (no stated days);
// "VOA" = visa on arrival; "EV" = e-visa; "ETA" = electronic travel authorization;
// "VR" = visa required; "NA" = no admission.
//
// Usage: node scripts/fetch-visa-matrix.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV_URL =
  "https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-matrix.csv";

function parseCsv(text) {
  // The dataset is a simple CSV without quoted commas in data rows, but the
  // header can theoretically contain them; handle bare quotes defensively.
  return text
    .trim()
    .split("\n")
    .map((line) => line.split(",").map((c) => c.replaceAll('"', "").trim()));
}

function toCode(v) {
  if (/^\d+$/.test(v)) return Number(v);
  switch (v) {
    case "visa free":
      return "VF";
    case "visa on arrival":
      return "VOA";
    case "e-visa":
      return "EV";
    case "eta":
      return "ETA";
    case "visa required":
      return "VR";
    case "no admission":
      return "NA";
    default:
      return null; // "-1" (self) and anything unknown
  }
}

async function main() {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Passport Index download failed: HTTP ${res.status}`);
  const rows = parseCsv(await res.text());
  const destinations = rows[0].slice(1);

  const matrix = {};
  for (const row of rows.slice(1)) {
    const origin = row[0];
    const entry = {};
    row.slice(1).forEach((v, i) => {
      const code = toCode(v);
      if (code !== null) entry[destinations[i]] = code;
    });
    matrix[origin] = entry;
  }

  const out = {
    source: "Passport Index dataset (github.com/ilyankou/passport-index-dataset)",
    updatedAt: new Date().toISOString().slice(0, 10),
    matrix,
  };
  writeFileSync(
    join(ROOT, "src/lib/visaMatrix.data.json"),
    JSON.stringify(out),
  );
  console.log(
    `Wrote visa matrix for ${Object.keys(matrix).length} origin countries to src/lib/visaMatrix.data.json`,
  );
}

main();
