// Hand-curated static data for the 18 curated destinations. These figures
// change slowly, have no free keyless API, and are refreshed manually (or by
// the monthly automation asking the model to re-verify them).
//
// Sources:
// - internet: Ookla Speedtest Global Index, median FIXED broadband download
//   Mbps (approximate, 2025). https://www.speedtest.net/global-index
// - plugs / voltage: IEC "World Plugs" reference. https://www.iec.ch/world-plugs
// - english: EF English Proficiency Index 2024 band (or "native").
//   https://www.ef.com/epi/

import { DESTINATIONS } from "./countries";

export interface StaticCountryData {
  /** Median fixed-broadband download speed, Mbps (approximate). */
  internetMbps: number;
  /** IEC plug letter types in common use. */
  plugTypes: string[];
  /** Mains voltage, volts. */
  voltage: string;
  /** EF EPI band, or "native" for English-speaking countries. */
  english: "native" | "very high" | "high" | "moderate" | "low" | "very low";
}

const DATA: Record<string, StaticCountryData> = {
  portugal: { internetMbps: 180, plugTypes: ["C", "F"], voltage: "230V", english: "very high" },
  spain: { internetMbps: 200, plugTypes: ["C", "F"], voltage: "230V", english: "moderate" },
  germany: { internetMbps: 95, plugTypes: ["C", "F"], voltage: "230V", english: "high" },
  netherlands: { internetMbps: 200, plugTypes: ["C", "F"], voltage: "230V", english: "very high" },
  france: { internetMbps: 230, plugTypes: ["C", "E"], voltage: "230V", english: "moderate" },
  italy: { internetMbps: 90, plugTypes: ["C", "F", "L"], voltage: "230V", english: "moderate" },
  ireland: { internetMbps: 110, plugTypes: ["G"], voltage: "230V", english: "native" },
  "united-kingdom": { internetMbps: 120, plugTypes: ["G"], voltage: "230V", english: "native" },
  "united-states": { internetMbps: 250, plugTypes: ["A", "B"], voltage: "120V", english: "native" },
  canada: { internetMbps: 180, plugTypes: ["A", "B"], voltage: "120V", english: "native" },
  australia: { internetMbps: 60, plugTypes: ["I"], voltage: "230V", english: "native" },
  "united-arab-emirates": { internetMbps: 290, plugTypes: ["G"], voltage: "230V", english: "moderate" },
  estonia: { internetMbps: 95, plugTypes: ["C", "F"], voltage: "230V", english: "high" },
  poland: { internetMbps: 130, plugTypes: ["C", "E"], voltage: "230V", english: "high" },
  mexico: { internetMbps: 70, plugTypes: ["A", "B"], voltage: "127V", english: "low" },
  thailand: { internetMbps: 230, plugTypes: ["A", "B", "C", "O"], voltage: "230V", english: "low" },
  japan: { internetMbps: 180, plugTypes: ["A", "B"], voltage: "100V", english: "low" },
  singapore: { internetMbps: 340, plugTypes: ["G"], voltage: "230V", english: "very high" },
};

const BY_NAME: Record<string, StaticCountryData> = Object.fromEntries(
  DESTINATIONS.filter((d) => DATA[d.slug]).map((d) => [
    d.name.toLowerCase(),
    DATA[d.slug],
  ]),
);

export function staticDataForCountry(name: string): StaticCountryData | null {
  return BY_NAME[name.trim().toLowerCase()] ?? null;
}
