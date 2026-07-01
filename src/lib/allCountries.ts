// Full list of countries (name + flag emoji) used for the autosuggest
// comboboxes in the relocation form. This restricts free-text entry to real
// countries. Destinations we have curated SEO pages / verified facts for are
// a subset of these (see countries.ts).

export interface Country {
  name: string;
  emoji: string;
}

export const ALL_COUNTRIES: Country[] = [
  { name: "Afghanistan", emoji: "🇦🇫" },
  { name: "Albania", emoji: "🇦🇱" },
  { name: "Algeria", emoji: "🇩🇿" },
  { name: "Andorra", emoji: "🇦🇩" },
  { name: "Angola", emoji: "🇦🇴" },
  { name: "Argentina", emoji: "🇦🇷" },
  { name: "Armenia", emoji: "🇦🇲" },
  { name: "Australia", emoji: "🇦🇺" },
  { name: "Austria", emoji: "🇦🇹" },
  { name: "Azerbaijan", emoji: "🇦🇿" },
  { name: "Bahamas", emoji: "🇧🇸" },
  { name: "Bahrain", emoji: "🇧🇭" },
  { name: "Bangladesh", emoji: "🇧🇩" },
  { name: "Barbados", emoji: "🇧🇧" },
  { name: "Belarus", emoji: "🇧🇾" },
  { name: "Belgium", emoji: "🇧🇪" },
  { name: "Belize", emoji: "🇧🇿" },
  { name: "Benin", emoji: "🇧🇯" },
  { name: "Bhutan", emoji: "🇧🇹" },
  { name: "Bolivia", emoji: "🇧🇴" },
  { name: "Bosnia and Herzegovina", emoji: "🇧🇦" },
  { name: "Botswana", emoji: "🇧🇼" },
  { name: "Brazil", emoji: "🇧🇷" },
  { name: "Brunei", emoji: "🇧🇳" },
  { name: "Bulgaria", emoji: "🇧🇬" },
  { name: "Burkina Faso", emoji: "🇧🇫" },
  { name: "Burundi", emoji: "🇧🇮" },
  { name: "Cambodia", emoji: "🇰🇭" },
  { name: "Cameroon", emoji: "🇨🇲" },
  { name: "Canada", emoji: "🇨🇦" },
  { name: "Cape Verde", emoji: "🇨🇻" },
  { name: "Chad", emoji: "🇹🇩" },
  { name: "Chile", emoji: "🇨🇱" },
  { name: "China", emoji: "🇨🇳" },
  { name: "Colombia", emoji: "🇨🇴" },
  { name: "Costa Rica", emoji: "🇨🇷" },
  { name: "Croatia", emoji: "🇭🇷" },
  { name: "Cuba", emoji: "🇨🇺" },
  { name: "Cyprus", emoji: "🇨🇾" },
  { name: "Czechia", emoji: "🇨🇿" },
  { name: "Denmark", emoji: "🇩🇰" },
  { name: "Dominican Republic", emoji: "🇩🇴" },
  { name: "Ecuador", emoji: "🇪🇨" },
  { name: "Egypt", emoji: "🇪🇬" },
  { name: "El Salvador", emoji: "🇸🇻" },
  { name: "Estonia", emoji: "🇪🇪" },
  { name: "Ethiopia", emoji: "🇪🇹" },
  { name: "Fiji", emoji: "🇫🇯" },
  { name: "Finland", emoji: "🇫🇮" },
  { name: "France", emoji: "🇫🇷" },
  { name: "Georgia", emoji: "🇬🇪" },
  { name: "Germany", emoji: "🇩🇪" },
  { name: "Ghana", emoji: "🇬🇭" },
  { name: "Greece", emoji: "🇬🇷" },
  { name: "Guatemala", emoji: "🇬🇹" },
  { name: "Honduras", emoji: "🇭🇳" },
  { name: "Hong Kong", emoji: "🇭🇰" },
  { name: "Hungary", emoji: "🇭🇺" },
  { name: "Iceland", emoji: "🇮🇸" },
  { name: "India", emoji: "🇮🇳" },
  { name: "Indonesia", emoji: "🇮🇩" },
  { name: "Iran", emoji: "🇮🇷" },
  { name: "Iraq", emoji: "🇮🇶" },
  { name: "Ireland", emoji: "🇮🇪" },
  { name: "Israel", emoji: "🇮🇱" },
  { name: "Italy", emoji: "🇮🇹" },
  { name: "Ivory Coast", emoji: "🇨🇮" },
  { name: "Jamaica", emoji: "🇯🇲" },
  { name: "Japan", emoji: "🇯🇵" },
  { name: "Jordan", emoji: "🇯🇴" },
  { name: "Kazakhstan", emoji: "🇰🇿" },
  { name: "Kenya", emoji: "🇰🇪" },
  { name: "Kuwait", emoji: "🇰🇼" },
  { name: "Kyrgyzstan", emoji: "🇰🇬" },
  { name: "Laos", emoji: "🇱🇦" },
  { name: "Latvia", emoji: "🇱🇻" },
  { name: "Lebanon", emoji: "🇱🇧" },
  { name: "Libya", emoji: "🇱🇾" },
  { name: "Liechtenstein", emoji: "🇱🇮" },
  { name: "Lithuania", emoji: "🇱🇹" },
  { name: "Luxembourg", emoji: "🇱🇺" },
  { name: "Macau", emoji: "🇲🇴" },
  { name: "Madagascar", emoji: "🇲🇬" },
  { name: "Malaysia", emoji: "🇲🇾" },
  { name: "Maldives", emoji: "🇲🇻" },
  { name: "Malta", emoji: "🇲🇹" },
  { name: "Mauritius", emoji: "🇲🇺" },
  { name: "Mexico", emoji: "🇲🇽" },
  { name: "Moldova", emoji: "🇲🇩" },
  { name: "Monaco", emoji: "🇲🇨" },
  { name: "Mongolia", emoji: "🇲🇳" },
  { name: "Montenegro", emoji: "🇲🇪" },
  { name: "Morocco", emoji: "🇲🇦" },
  { name: "Mozambique", emoji: "🇲🇿" },
  { name: "Myanmar", emoji: "🇲🇲" },
  { name: "Namibia", emoji: "🇳🇦" },
  { name: "Nepal", emoji: "🇳🇵" },
  { name: "Netherlands", emoji: "🇳🇱" },
  { name: "New Zealand", emoji: "🇳🇿" },
  { name: "Nicaragua", emoji: "🇳🇮" },
  { name: "Nigeria", emoji: "🇳🇬" },
  { name: "North Macedonia", emoji: "🇲🇰" },
  { name: "Norway", emoji: "🇳🇴" },
  { name: "Oman", emoji: "🇴🇲" },
  { name: "Pakistan", emoji: "🇵🇰" },
  { name: "Panama", emoji: "🇵🇦" },
  { name: "Paraguay", emoji: "🇵🇾" },
  { name: "Peru", emoji: "🇵🇪" },
  { name: "Philippines", emoji: "🇵🇭" },
  { name: "Poland", emoji: "🇵🇱" },
  { name: "Portugal", emoji: "🇵🇹" },
  { name: "Qatar", emoji: "🇶🇦" },
  { name: "Romania", emoji: "🇷🇴" },
  { name: "Russia", emoji: "🇷🇺" },
  { name: "Rwanda", emoji: "🇷🇼" },
  { name: "Saudi Arabia", emoji: "🇸🇦" },
  { name: "Senegal", emoji: "🇸🇳" },
  { name: "Serbia", emoji: "🇷🇸" },
  { name: "Singapore", emoji: "🇸🇬" },
  { name: "Slovakia", emoji: "🇸🇰" },
  { name: "Slovenia", emoji: "🇸🇮" },
  { name: "South Africa", emoji: "🇿🇦" },
  { name: "South Korea", emoji: "🇰🇷" },
  { name: "Spain", emoji: "🇪🇸" },
  { name: "Sri Lanka", emoji: "🇱🇰" },
  { name: "Sweden", emoji: "🇸🇪" },
  { name: "Switzerland", emoji: "🇨🇭" },
  { name: "Taiwan", emoji: "🇹🇼" },
  { name: "Tanzania", emoji: "🇹🇿" },
  { name: "Thailand", emoji: "🇹🇭" },
  { name: "Tunisia", emoji: "🇹🇳" },
  { name: "Turkey", emoji: "🇹🇷" },
  { name: "Uganda", emoji: "🇺🇬" },
  { name: "Ukraine", emoji: "🇺🇦" },
  { name: "United Arab Emirates", emoji: "🇦🇪" },
  { name: "United Kingdom", emoji: "🇬🇧" },
  { name: "United States", emoji: "🇺🇸" },
  { name: "Uruguay", emoji: "🇺🇾" },
  { name: "Uzbekistan", emoji: "🇺🇿" },
  { name: "Venezuela", emoji: "🇻🇪" },
  { name: "Vietnam", emoji: "🇻🇳" },
  { name: "Zambia", emoji: "🇿🇲" },
  { name: "Zimbabwe", emoji: "🇿🇼" },
];

// Common aliases so typing "USA" / "UK" / "UAE" surfaces the right country.
const ALIASES: Record<string, string> = {
  usa: "United States",
  us: "United States",
  america: "United States",
  uk: "United Kingdom",
  britain: "United Kingdom",
  england: "United Kingdom",
  uae: "United Arab Emirates",
  emirates: "United Arab Emirates",
  holland: "Netherlands",
  "south korea": "South Korea",
  korea: "South Korea",
};

export function searchCountries(query: string, limit = 8): Country[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_COUNTRIES.slice(0, limit);

  const aliasTarget = ALIASES[q];
  const scored = ALL_COUNTRIES.map((c) => {
    const name = c.name.toLowerCase();
    let score = -1;
    if (aliasTarget && c.name === aliasTarget) score = 100;
    else if (name === q) score = 90;
    else if (name.startsWith(q)) score = 70;
    else if (name.includes(q)) score = 40;
    return { c, score };
  }).filter((s) => s.score >= 0);

  scored.sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));
  return scored.slice(0, limit).map((s) => s.c);
}

export function isValidCountry(name: string): boolean {
  const n = name.trim().toLowerCase();
  return ALL_COUNTRIES.some((c) => c.name.toLowerCase() === n);
}
