import type { MetadataRoute } from "next";
import { DESTINATIONS } from "@/lib/countries";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://relochecklist.vercel.app";

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
  ];
}
