import { DESTINATIONS, findDestination } from "@/lib/countries";
import {
  costDetailForSlug,
  slugsWithCostDetail,
  COST_OF_LIVING_VERIFIED,
} from "@/lib/costOfLiving";
import { advisoryForCountry } from "@/lib/countryAdvisory";

// Curated ranking pages ("cheapest countries to live in", "safest countries
// to move to") built ENTIRELY from data we already publish — a single, stated
// metric per list, sorted transparently. No editorial "best" claims: the
// methodology line makes the criterion explicit so each page is defensible.

export interface RankingEntry {
  slug: string;
  name: string;
  emoji: string;
  sortValue: number;
  display: string;
}

export interface RankingSource {
  label: string;
  url?: string;
}

export interface Ranking {
  slug: string;
  h1: string;
  metaTitle: string;
  description: string;
  intro: string;
  // Explicit criterion so the list is honest, not an opinion.
  methodology: string;
  // The value column header.
  metricLabel: string;
  whoFor: string;
  source: RankingSource;
  // Where each row links (cost page is most relevant for money lists).
  linkTo: "cost-of-living" | "moving-to";
  compute: () => RankingEntry[];
}

export const RANKINGS: Ranking[] = [
  {
    slug: "countries-with-the-lowest-cost-of-living",
    h1: "Countries with the lowest cost of living (2026)",
    metaTitle:
      "Lowest cost of living countries (2026): ranked vs the USA",
    description:
      "Countries with the lowest cost of living, ranked by a cost index against the USA (USA = 100, excluding rent) — with sources.",
    intro:
      "Ranked by a consumer cost index against the USA (USA = 100, excluding rent). Lower means cheaper day-to-day than the US average.",
    methodology:
      "Ranking = lowest consumer cost index vs the USA (USA = 100, excluding rent). Only countries with a researched index appear.",
    metricLabel: "Cost index (USA = 100)",
    whoFor:
      "Best for a quick read on how far your money goes versus US prices.",
    source: { label: "Numbeo cost-of-living index (or equivalent)" },
    linkTo: "cost-of-living",
    compute: () => {
      const rows: RankingEntry[] = [];
      for (const slug of slugsWithCostDetail()) {
        const dest = findDestination(slug);
        const idx = costDetailForSlug(slug)?.costIndexVsUsa;
        if (!dest || !idx) continue;
        rows.push({
          slug,
          name: dest.name,
          emoji: dest.emoji,
          sortValue: idx.value,
          display: `${idx.value} / 100`,
        });
      }
      return rows.sort((a, b) => a.sortValue - b.sortValue);
    },
  },
  {
    slug: "safest-countries-to-move-to",
    h1: "Safest countries to move to (2026)",
    metaTitle:
      "Safest countries to move to (2026): U.S. State Dept advisory levels",
    description:
      "The safest destinations to relocate to, ranked by the U.S. State Department travel advisory level (1 = normal precautions).",
    intro:
      "Ranked by the U.S. State Department travel advisory level, where 1 (exercise normal precautions) is safest. Same-level countries are listed alphabetically.",
    methodology:
      "Ranking = lowest U.S. State Department travel advisory level (1–4). Advisories cover travel safety, not everyday liveability.",
    metricLabel: "Advisory level",
    whoFor:
      "A useful first filter on safety — pair it with local, city-level research.",
    source: {
      label: "U.S. State Department travel advisories",
      url: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html",
    },
    linkTo: "moving-to",
    compute: () => {
      const rows: RankingEntry[] = [];
      for (const dest of DESTINATIONS) {
        if (dest.slug === "united-states") continue;
        const adv = advisoryForCountry(dest.name);
        if (!adv) continue;
        rows.push({
          slug: dest.slug,
          name: dest.name,
          emoji: dest.emoji,
          sortValue: adv.level,
          display: `Level ${adv.level} · ${adv.label}`,
        });
      }
      return rows.sort(
        (a, b) => a.sortValue - b.sortValue || a.name.localeCompare(b.name),
      );
    },
  },
];

export const RANKINGS_VERIFIED = COST_OF_LIVING_VERIFIED;

export function rankingForSlug(slug: string): Ranking | null {
  return RANKINGS.find((r) => r.slug === slug) ?? null;
}

export function allRankingSlugs(): string[] {
  return RANKINGS.map((r) => r.slug);
}
