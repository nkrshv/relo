export interface Destination {
  slug: string;
  name: string;
  emoji: string;
  countryCode: string;
}

// Popular relocation destinations used for the form dropdown and
// programmatic SEO pages (/moving-to/[country]).
export const DESTINATIONS: Destination[] = [
  { slug: "portugal", name: "Portugal", emoji: "🇵🇹", countryCode: "PT" },
  { slug: "spain", name: "Spain", emoji: "🇪🇸", countryCode: "ES" },
  { slug: "germany", name: "Germany", emoji: "🇩🇪", countryCode: "DE" },
  { slug: "netherlands", name: "Netherlands", emoji: "🇳🇱", countryCode: "NL" },
  { slug: "france", name: "France", emoji: "🇫🇷", countryCode: "FR" },
  { slug: "italy", name: "Italy", emoji: "🇮🇹", countryCode: "IT" },
  { slug: "ireland", name: "Ireland", emoji: "🇮🇪", countryCode: "IE" },
  { slug: "united-kingdom", name: "United Kingdom", emoji: "🇬🇧", countryCode: "GB" },
  { slug: "united-states", name: "United States", emoji: "🇺🇸", countryCode: "US" },
  { slug: "canada", name: "Canada", emoji: "🇨🇦", countryCode: "CA" },
  { slug: "australia", name: "Australia", emoji: "🇦🇺", countryCode: "AU" },
  { slug: "united-arab-emirates", name: "United Arab Emirates", emoji: "🇦🇪", countryCode: "AE" },
  { slug: "estonia", name: "Estonia", emoji: "🇪🇪", countryCode: "EE" },
  { slug: "poland", name: "Poland", emoji: "🇵🇱", countryCode: "PL" },
  { slug: "mexico", name: "Mexico", emoji: "🇲🇽", countryCode: "MX" },
  { slug: "thailand", name: "Thailand", emoji: "🇹🇭", countryCode: "TH" },
  { slug: "japan", name: "Japan", emoji: "🇯🇵", countryCode: "JP" },
  { slug: "singapore", name: "Singapore", emoji: "🇸🇬", countryCode: "SG" },
  { slug: "greece", name: "Greece", emoji: "🇬🇷", countryCode: "GR" },
  { slug: "cyprus", name: "Cyprus", emoji: "🇨🇾", countryCode: "CY" },
  { slug: "malta", name: "Malta", emoji: "🇲🇹", countryCode: "MT" },
  { slug: "switzerland", name: "Switzerland", emoji: "🇨🇭", countryCode: "CH" },
  { slug: "austria", name: "Austria", emoji: "🇦🇹", countryCode: "AT" },
  { slug: "czechia", name: "Czechia", emoji: "🇨🇿", countryCode: "CZ" },
  { slug: "georgia", name: "Georgia", emoji: "🇬🇪", countryCode: "GE" },
  { slug: "armenia", name: "Armenia", emoji: "🇦🇲", countryCode: "AM" },
  { slug: "turkey", name: "Turkey", emoji: "🇹🇷", countryCode: "TR" },
  { slug: "brazil", name: "Brazil", emoji: "🇧🇷", countryCode: "BR" },
  { slug: "argentina", name: "Argentina", emoji: "🇦🇷", countryCode: "AR" },
  { slug: "uruguay", name: "Uruguay", emoji: "🇺🇾", countryCode: "UY" },
  { slug: "costa-rica", name: "Costa Rica", emoji: "🇨🇷", countryCode: "CR" },
  { slug: "panama", name: "Panama", emoji: "🇵🇦", countryCode: "PA" },
  { slug: "colombia", name: "Colombia", emoji: "🇨🇴", countryCode: "CO" },
  { slug: "malaysia", name: "Malaysia", emoji: "🇲🇾", countryCode: "MY" },
  { slug: "indonesia", name: "Indonesia", emoji: "🇮🇩", countryCode: "ID" },
  { slug: "vietnam", name: "Vietnam", emoji: "🇻🇳", countryCode: "VN" },
  { slug: "new-zealand", name: "New Zealand", emoji: "🇳🇿", countryCode: "NZ" },
  { slug: "russia", name: "Russia", emoji: "🇷🇺", countryCode: "RU" },
];

export function findDestination(slug: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.slug === slug);
}
