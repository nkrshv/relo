// "Climate twin" comparison: how the destination's weather and air feel
// against the mover's home over the same reference year, plus what to pack.
// Types and the pure comparison logic live here; live fetching (Open-Meteo
// for climate, OpenAQ for annual pollutant averages) is done server-side in
// /api/climate-twin, and the client hook is useClimateTwin.

export interface Pollutant {
  /** OpenAQ parameter name, e.g. "pm25". */
  parameter: string;
  /** Human label, e.g. "PM2.5". */
  label: string;
  /** Annual mean for the reference year. */
  value: number;
  unit: string;
  year: number;
  /** Nearest measuring station name. */
  station: string | null;
}

export interface ClimatePoint {
  /** Resolved place name (city when known, otherwise the country). */
  label: string;
  /** Mean daily temperature (°C) for January and July. */
  janC: number | null;
  julC: number | null;
  /** Mean daily temperature (°C) of the coldest / warmest calendar month. */
  coldestC: number | null;
  warmestC: number | null;
  /** 1-12 index of the coldest / warmest / wettest month. */
  coldestMonth: number | null;
  warmestMonth: number | null;
  wettestMonth: number | null;
  /** Total precipitation over the reference year (mm). */
  annualPrecipMm: number | null;
  /** Mean daily relative humidity (%). */
  humidityPct: number | null;
  /** Days in the reference year with more than 4.5 hours of sunshine. */
  sunnyDays: number | null;
  /** Annual pollutant averages from the nearest OpenAQ sensors. */
  air: Pollutant[];
  /** Reference year for the climate normals. */
  year: number | null;
}

export type Comfort = "similar" | "milder" | "harsher" | "mixed";

/** A packing recommendation shaped like a checklist task. */
export interface PackingItem {
  title: string;
  why: string;
}

export interface ClimateTwin {
  home: ClimatePoint;
  dest: ClimatePoint;
  comfort: Comfort;
  /** One-line human comparisons (winter, summer, rain, air, humidity). */
  verdicts: string[];
  /**
   * What to pack, as checklist-ready tasks (a short title plus a reasoned
   * "why"). Leads with one consolidated clothing recommendation reasoned
   * against the mover's home climate (does the home wardrobe transfer, or do
   * they need to buy specifics), followed by any health item like masks.
   */
  packing: PackingItem[];
  /** Optional 1-2 sentence plain-language read, grounded in the numbers. */
  aiSummary: string | null;
  /** Attribution labels for the data sources actually used. */
  sources: string[];
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthName(m: number | null): string {
  return m && m >= 1 && m <= 12 ? MONTHS[m - 1] : "";
}

function round(n: number): number {
  return Math.round(n);
}

export function pollutant(
  point: ClimatePoint,
  parameter: string,
): Pollutant | null {
  return point.air.find((p) => p.parameter === parameter) ?? null;
}

// WHO 2021 air-quality guideline: annual mean PM2.5 at or below 5 µg/m³; an
// annual average above ~25 is genuinely unhealthy air to live in.
const PM25_UNHEALTHY = 25;

/**
 * Turn two resolved climate points into plain-language verdicts and a packing
 * list. Every line degrades gracefully: a comparison only appears when both
 * sides have the underlying number.
 */
export function buildTwinComparison(
  home: ClimatePoint,
  dest: ClimatePoint,
): Pick<ClimateTwin, "comfort" | "verdicts" | "packing"> {
  const verdicts: string[] = [];
  const homeName = home.label;
  const destName = dest.label;

  const tempDeltas: number[] = [];

  // Winter feel: coldest-month mean against coldest-month mean.
  if (home.coldestC !== null && dest.coldestC !== null) {
    const d = dest.coldestC - home.coldestC;
    tempDeltas.push(d);
    if (Math.abs(d) >= 2) {
      verdicts.push(
        `Winters in ${destName} run about ${Math.abs(round(d))}° ${
          d > 0 ? "warmer" : "colder"
        } than ${homeName}, with the coldest month averaging around ${round(
          dest.coldestC,
        )}°.`,
      );
    } else {
      verdicts.push(
        `Winters feel much like ${homeName}, around ${round(dest.coldestC)}° in the coldest month.`,
      );
    }
  }

  // Summer feel: warmest-month mean against warmest-month mean.
  if (home.warmestC !== null && dest.warmestC !== null) {
    const d = dest.warmestC - home.warmestC;
    tempDeltas.push(d);
    if (Math.abs(d) >= 2) {
      verdicts.push(
        `Summers are about ${Math.abs(round(d))}° ${
          d > 0 ? "hotter" : "cooler"
        }, peaking near ${round(dest.warmestC)}° in the warmest month.`,
      );
    }
  }

  // Rainfall over the year.
  if (home.annualPrecipMm !== null && dest.annualPrecipMm !== null) {
    const ratio = dest.annualPrecipMm / Math.max(home.annualPrecipMm, 1);
    if (ratio >= 1.3 || ratio <= 0.77) {
      verdicts.push(
        `It is noticeably ${ratio >= 1.3 ? "wetter" : "drier"}: roughly ${round(
          dest.annualPrecipMm,
        )} mm of rain a year versus about ${round(
          home.annualPrecipMm,
        )} mm at home${
          dest.wettestMonth
            ? `, heaviest around ${monthName(dest.wettestMonth)}`
            : ""
        }.`,
      );
    }
  }

  // Humidity.
  if (home.humidityPct !== null && dest.humidityPct !== null) {
    const d = dest.humidityPct - home.humidityPct;
    if (Math.abs(d) >= 8) {
      verdicts.push(
        `The air is ${d > 0 ? "more humid" : "drier"} than home (about ${round(
          dest.humidityPct,
        )}% versus ${round(home.humidityPct)}%).`,
      );
    }
  }

  // Sunshine: days with more than 4.5 hours of sun over the reference year.
  if (home.sunnyDays !== null && dest.sunnyDays !== null) {
    const d = dest.sunnyDays - home.sunnyDays;
    if (Math.abs(d) >= 15) {
      verdicts.push(
        `${destName} gets about ${Math.abs(d)} ${
          d > 0 ? "more" : "fewer"
        } sunny days a year than home (${dest.sunnyDays} versus ${home.sunnyDays} days with over 4.5 hours of sun).`,
      );
    } else {
      verdicts.push(
        `A similar number of sunny days to home: about ${dest.sunnyDays} days a year with over 4.5 hours of sun.`,
      );
    }
  }

  // Air quality (annual PM2.5 average, the health-relevant headline).
  const airHarsher = airIsHarsher(home, dest);
  const homePm = pollutant(home, "pm25");
  const destPm = pollutant(dest, "pm25");
  if (destPm) {
    if (homePm && homePm.unit === destPm.unit) {
      const d = destPm.value - homePm.value;
      if (Math.abs(d) >= 3) {
        verdicts.push(
          `Yearly air is ${d > 0 ? "dirtier" : "cleaner"} than home: PM2.5 averages ${round(
            destPm.value,
          )} versus ${round(homePm.value)} ${destPm.unit}${
            destPm.value >= PM25_UNHEALTHY ? ", above healthy levels" : ""
          }.`,
        );
      } else {
        verdicts.push(
          `Yearly air quality is similar to home (PM2.5 around ${round(destPm.value)} ${destPm.unit}).`,
        );
      }
    } else {
      verdicts.push(
        `PM2.5 near ${destName} averages ${round(destPm.value)} ${destPm.unit} a year${
          destPm.value >= PM25_UNHEALTHY ? ", above healthy levels" : ""
        }.`,
      );
    }
  }

  const packing = buildPacking(home, dest, airHarsher);

  // Overall comfort read from the temperature swing and air.
  const maxTempDelta = tempDeltas.reduce((m, d) => Math.max(m, Math.abs(d)), 0);
  const sumTempDelta = tempDeltas.reduce((a, b) => a + b, 0);
  let comfort: Comfort = "similar";
  if (tempDeltas.length > 0) {
    if (maxTempDelta < 3 && !airHarsher) comfort = "similar";
    else if (maxTempDelta >= 8) comfort = "mixed"; // a drastic shift either way
    else if (airHarsher) comfort = "harsher";
    else if (sumTempDelta > 0) comfort = "milder";
    else comfort = "harsher";
  }

  return { comfort, verdicts, packing };
}

// Compare the pollutants both cities share: destination air counts as harsher
// when clearly more of them are elevated (>=25% higher) than are lower.
function airIsHarsher(home: ClimatePoint, dest: ClimatePoint): boolean {
  let worse = 0;
  let better = 0;
  for (const d of dest.air) {
    const h = pollutant(home, d.parameter);
    if (!h || h.value <= 0 || h.unit !== d.unit) continue;
    const ratio = d.value / h.value;
    if (ratio >= 1.25) worse += 1;
    else if (ratio <= 0.8) better += 1;
  }
  const destPm = pollutant(dest, "pm25");
  if (worse === 0 && better === 0 && destPm) {
    return destPm.value >= PM25_UNHEALTHY;
  }
  return worse > better;
}

function buildPacking(
  home: ClimatePoint,
  dest: ClimatePoint,
  airHarsher: boolean,
): PackingItem[] {
  const packing: PackingItem[] = [buildClothingAdvice(home, dest)];

  const destPm = pollutant(dest, "pm25");
  if (destPm && destPm.value >= PM25_UNHEALTHY && airHarsher) {
    packing.push({
      title: "Pack a few N95 masks",
      why: `For high-pollution days in ${dest.label} if you are sensitive to air quality.`,
    });
  }

  return packing;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * One consolidated clothing recommendation, reasoned from the mover's home
 * climate rather than the destination alone. It only names gear the
 * destination demands that home does not already prepare them for, so it says
 * "your wardrobe transfers" when the two climates are close and lists
 * specifics (warm layers, breathable fabrics, rain gear) only when they
 * genuinely differ.
 */
function buildClothingAdvice(
  home: ClimatePoint,
  dest: ClimatePoint,
): PackingItem {
  const needs: string[] = [];

  // Cold: destination has a real winter that home does not match.
  if (dest.coldestC !== null && dest.coldestC < 5) {
    const homeAlreadyCold =
      home.coldestC !== null && home.coldestC <= dest.coldestC + 3;
    if (!homeAlreadyCold) {
      needs.push(
        dest.coldestC < 0
          ? `a serious winter coat, thermals and gloves for a coldest month near ${round(dest.coldestC)}°`
          : `a proper winter coat and warm layers for a coldest month near ${round(dest.coldestC)}°`,
      );
    }
  }

  // Heat: destination summers run hotter than home.
  if (dest.warmestC !== null && dest.warmestC >= 27) {
    const homeAlreadyHot =
      home.warmestC !== null && home.warmestC >= dest.warmestC - 3;
    if (!homeAlreadyHot) {
      needs.push(
        `lightweight, breathable clothing and sun protection for a warmest month near ${round(dest.warmestC)}°${
          dest.warmestMonth ? ` in ${monthName(dest.warmestMonth)}` : ""
        }`,
      );
    }
  }

  // Humidity: noticeably muggier than home, so fabric choice matters.
  if (
    dest.humidityPct !== null &&
    dest.humidityPct >= 70 &&
    (home.humidityPct === null || dest.humidityPct - home.humidityPct >= 8)
  ) {
    needs.push(
      `quick-drying, breathable natural fabrics for humidity around ${round(dest.humidityPct)}%`,
    );
  }

  // Rain: wetter than home, or heavy in absolute terms.
  const muchWetter =
    dest.annualPrecipMm !== null &&
    (dest.annualPrecipMm >= 900 ||
      (home.annualPrecipMm !== null &&
        dest.annualPrecipMm / Math.max(home.annualPrecipMm, 1) >= 1.3));
  if (muchWetter) {
    needs.push(
      `a waterproof jacket${
        dest.wettestMonth ? ` for the rain around ${monthName(dest.wettestMonth)}` : ""
      }`,
    );
  }

  const homeName = home.label;
  if (needs.length === 0) {
    return {
      title: "Pack your usual wardrobe",
      why: `Your ${homeName} clothes should transfer well: temperatures, humidity and rainfall in ${dest.label} are close to what you already dress for, so there is little you need to buy specially.`,
    };
  }

  return {
    title: `Pack for ${dest.label}'s climate`,
    why: `Your ${homeName} wardrobe covers most of it, but ${dest.label} also calls for ${joinList(
      needs,
    )}, which you may not already own.`,
  };
}
