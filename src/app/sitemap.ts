import type { MetadataRoute } from "next";
import { DESTINATIONS } from "@/lib/countries";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://relochecklist.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...DESTINATIONS.map((d) => ({
      url: `${SITE_URL}/moving-to/${d.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
