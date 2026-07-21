import { DESTINATIONS } from "@/lib/countries";
import { allCostCityParams } from "@/lib/costOfLiving";
import { allRankingSlugs } from "@/lib/rankings";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://reloka.to";

// Every indexable page on the site, used by the sitemap and IndexNow.
export function allSiteUrls(): string[] {
  const urls = [
    SITE_URL,
    `${SITE_URL}/plan`,
    `${SITE_URL}/compare`,
    `${SITE_URL}/best`,
  ];
  for (const slug of allRankingSlugs()) {
    urls.push(`${SITE_URL}/best/${slug}`);
  }
  for (const d of DESTINATIONS) {
    urls.push(`${SITE_URL}/moving-to/${d.slug}`);
    urls.push(`${SITE_URL}/cost-of-living/${d.slug}`);
  }
  for (const p of allCostCityParams()) {
    urls.push(`${SITE_URL}/cost-of-living/${p.country}/${p.city}`);
  }
  for (let i = 0; i < DESTINATIONS.length; i++) {
    for (let j = i + 1; j < DESTINATIONS.length; j++) {
      urls.push(
        `${SITE_URL}/compare/${DESTINATIONS[i].slug}-vs-${DESTINATIONS[j].slug}`,
      );
    }
  }
  return urls;
}
