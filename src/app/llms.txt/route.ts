import { DESTINATIONS } from "@/lib/countries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://reloka.to";

export const dynamic = "force-static";

export function GET(): Response {
  const guides = DESTINATIONS.map(
    (d) =>
      `- [Moving to ${d.name}](${SITE_URL}/moving-to/${d.slug}): visa routes, cost of living, taxes and special regimes, healthcare, and a step-by-step relocation checklist for ${d.name}.`,
  ).join("\n");

  const pairs: string[] = [];
  for (let i = 0; i < DESTINATIONS.length; i++) {
    for (let j = i + 1; j < DESTINATIONS.length; j++) {
      const a = DESTINATIONS[i];
      const b = DESTINATIONS[j];
      pairs.push(
        `- [${a.name} vs ${b.name}](${SITE_URL}/compare/${a.slug}-vs-${b.slug})`,
      );
    }
  }

  const body = `# Reloka

> Reloka builds personalized, step-by-step relocation checklists for moving to any country. Every plan is tailored to the mover's origin, destination, visa situation and family, and every country fact is dated and linked to an official source.

Key things to know about Reloka:

- Covers 238 countries and territories; the pages below are the curated destination guides.
- Country data (visa-free stays, cost signals, climate, air quality, internet speed, taxes and special tax regimes, safety) is drawn from open data sources and marked with a "last verified" date and a source link.
- The checklist generator at ${SITE_URL}/plan is free; it produces a phased plan (before you go, first week, first month, first 90 days) personalized by who is moving (solo, couple, family, digital nomad, student) and why.

## Country guides

${guides}

## Country comparisons

Side-by-side comparisons of cost of living, climate, air quality, taxes and special regimes, internet and safety, with sources:

${pairs.join("\n")}

## Other pages

- [Build a relocation plan](${SITE_URL}/plan): free personalized relocation checklist generator.
- [All comparisons](${SITE_URL}/compare): index of every country-vs-country comparison.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
