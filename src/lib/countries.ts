export interface Destination {
  slug: string;
  name: string;
  emoji: string;
}

// Popular relocation destinations used for the form dropdown and
// programmatic SEO pages (/moving-to/[country]).
export const DESTINATIONS: Destination[] = [
  { slug: "portugal", name: "Portugal", emoji: "🇵🇹" },
  { slug: "spain", name: "Spain", emoji: "🇪🇸" },
  { slug: "germany", name: "Germany", emoji: "🇩🇪" },
  { slug: "netherlands", name: "Netherlands", emoji: "🇳🇱" },
  { slug: "france", name: "France", emoji: "🇫🇷" },
  { slug: "italy", name: "Italy", emoji: "🇮🇹" },
  { slug: "ireland", name: "Ireland", emoji: "🇮🇪" },
  { slug: "united-kingdom", name: "United Kingdom", emoji: "🇬🇧" },
  { slug: "united-states", name: "United States", emoji: "🇺🇸" },
  { slug: "canada", name: "Canada", emoji: "🇨🇦" },
  { slug: "australia", name: "Australia", emoji: "🇦🇺" },
  { slug: "united-arab-emirates", name: "United Arab Emirates", emoji: "🇦🇪" },
  { slug: "estonia", name: "Estonia", emoji: "🇪🇪" },
  { slug: "poland", name: "Poland", emoji: "🇵🇱" },
  { slug: "mexico", name: "Mexico", emoji: "🇲🇽" },
  { slug: "thailand", name: "Thailand", emoji: "🇹🇭" },
  { slug: "japan", name: "Japan", emoji: "🇯🇵" },
  { slug: "singapore", name: "Singapore", emoji: "🇸🇬" },
];

export function findDestination(slug: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.slug === slug);
}
