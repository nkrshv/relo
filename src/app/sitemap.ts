import type { MetadataRoute } from "next";
import { DESTINATIONS } from "@/lib/countries";
import { allCostCityParams } from "@/lib/costOfLiving";
import { allGlossarySlugs } from "@/lib/glossary";
import { allRankingSlugs } from "@/lib/rankings";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://reloka.to";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/plan`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...DESTINATIONS.map((d) => ({
      url: `${SITE_URL}/moving-to/${d.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...DESTINATIONS.filter((d) => d.slug !== "united-states").map((d) => ({
      url: `${SITE_URL}/moving-to/${d.slug}/from-usa`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...DESTINATIONS.map((d) => ({
      url: `${SITE_URL}/cost-of-living/${d.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...allCostCityParams().map((p) => ({
      url: `${SITE_URL}/cost-of-living/${p.country}/${p.city}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/compare`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    ...DESTINATIONS.flatMap((a, i) =>
      DESTINATIONS.slice(i + 1).map((b) => ({
        url: `${SITE_URL}/compare/${a.slug}-vs-${b.slug}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ),
    {
      url: `${SITE_URL}/glossary`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...allGlossarySlugs().map((slug) => ({
      url: `${SITE_URL}/glossary/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    {
      url: `${SITE_URL}/best`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...allRankingSlugs().map((slug) => ({
      url: `${SITE_URL}/best/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
