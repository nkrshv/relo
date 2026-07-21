// Content helpers for the /cost-of-living/[country] pages. Cost-focused, built
// from the data we already have (Big Mac, EU price level, inflation, advertised
// salary, OECD tax wedge, currency) so each page is genuinely about money and
// not a thin duplicate of /moving-to. The richer monthly budget tables come
// from costOfLiving.ts when researched detail exists.

import { insightsForCountry, INSIGHTS_UPDATED_AT } from "@/lib/countryInsights";
import { openDataForCountry } from "@/lib/countryOpenData";
import { OPEN_DATA_UPDATED_AT } from "@/lib/countryOpenData.generated";
import { currencyForCountry } from "@/lib/countryCurrency";
import { salaryForCountry, formatSalary } from "@/lib/countrySalaries";
import { formatMonth, formatDate } from "@/lib/dates";
import { formatRange, type CountryCost } from "@/lib/costOfLiving";

export interface CostFact {
  label: string;
  value: string;
  source: string;
}

// Money-only "at a glance" cells (distinct from the general /moving-to grid).
export function costFacts(name: string): CostFact[] {
  const ins = insightsForCountry(name);
  const od = openDataForCountry(name);
  const sal = salaryForCountry(name);
  const currency = currencyForCountry(name);
  const facts: (CostFact | null)[] = [
    od?.priceLevelEU
      ? {
          label: "Consumer prices vs EU average",
          value: `${od.priceLevelEU.value >= 100 ? "+" : "−"}${Math.abs(Math.round(od.priceLevelEU.value - 100))}%`,
          source: `Eurostat ${od.priceLevelEU.year}`,
        }
      : null,
    ins?.bigMacUsd
      ? {
          label: "Big Mac price",
          value: `$${ins.bigMacUsd.value.toFixed(2)}`,
          source: `The Economist, ${formatMonth(ins.bigMacUsd.date.slice(0, 7))}`,
        }
      : null,
    ins?.inflation
      ? {
          label: "Inflation (annual)",
          value: `${ins.inflation.value.toFixed(1)}%`,
          source: `World Bank ${ins.inflation.year}`,
        }
      : null,
    sal?.avgAnnual
      ? {
          label: "Avg advertised salary",
          value: `${formatSalary(sal.avgAnnual, sal.currency)} / yr`,
          source: sal.avgMonth ? `Adzuna, ${formatMonth(sal.avgMonth)}` : "Adzuna",
        }
      : null,
    od?.taxWedge
      ? {
          label: "Employment taxes (tax wedge)",
          value: `${Math.round(od.taxWedge.value)}%`,
          source: `OECD ${od.taxWedge.year}`,
        }
      : null,
    currency
      ? { label: "Currency", value: currency, source: "ISO 4217" }
      : null,
  ];
  return facts.filter((f): f is CostFact => f !== null);
}

// A short, cost-specific lead sentence unique to each country.
export function costIntro(name: string): string {
  const od = openDataForCountry(name);
  const ins = insightsForCountry(name);
  const sal = salaryForCountry(name);
  const parts: string[] = [];
  if (od?.priceLevelEU) {
    const diff = Math.round(od.priceLevelEU.value - 100);
    parts.push(
      `consumer prices run about ${Math.abs(diff)}% ${diff >= 0 ? "above" : "below"} the EU average`,
    );
  }
  if (ins?.bigMacUsd) {
    parts.push(`a Big Mac costs about $${ins.bigMacUsd.value.toFixed(2)}`);
  }
  if (sal?.avgAnnual) {
    parts.push(
      `the average advertised salary is around ${formatSalary(sal.avgAnnual, sal.currency)} a year`,
    );
  }
  if (parts.length === 0) return "";
  const joined =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`;
}

export function costFaqFor(
  name: string,
  detail?: CountryCost | null,
): { q: string; a: string }[] {
  const od = openDataForCountry(name);
  const ins = insightsForCountry(name);
  const sal = salaryForCountry(name);
  const capital = detail?.cities[0];
  const single = capital?.monthlyBudgetSingle;
  const family = capital?.monthlyBudgetFamily4;
  const budgetAnswer =
    capital && single
      ? `In ${capital.city}, expect roughly ${formatRange(single.usd, "USD")} a month in living costs for a single person${family ? `, and about ${formatRange(family.usd, "USD")} for a family of four` : ""}, excluding rent (${formatMonth(detail!.asOf)}). Add rent from the table below — a one-bed typically runs ${capital.rent1brCenter ? formatRange(capital.rent1brCenter.usd, "USD") : "the amounts shown"} in the centre. Costs vary by district, so generate a free plan above for a budget matched to your exact city, household and priorities.`
      : `It depends on the city, whether you rent in the centre, and your lifestyle. Use the figures on this page as a starting point, then generate a free plan above — it estimates a budget for your exact destination city, household size and priorities.`;
  const faqs: { q: string; a: string }[] = [
    {
      q: `How much money do I need to live in ${name}?`,
      a: budgetAnswer,
    },
  ];
  if (od?.priceLevelEU) {
    const diff = Math.round(od.priceLevelEU.value - 100);
    faqs.push({
      q: `Is ${name} expensive?`,
      a: `Consumer prices in ${name} are about ${Math.abs(diff)}% ${diff >= 0 ? "higher than" : "lower than"} the EU average (Eurostat ${od.priceLevelEU.year}, household final consumption price level). That is a country-wide comparison; the capital is usually pricier than smaller cities.`,
    });
  }
  if (ins?.inflation) {
    faqs.push({
      q: `What is the inflation rate in ${name}?`,
      a: `Annual inflation was about ${ins.inflation.value.toFixed(1)}% (World Bank ${ins.inflation.year}). High or volatile inflation can change rents and grocery prices quickly, so treat older figures with caution.`,
    });
  }
  if (sal?.avgAnnual) {
    faqs.push({
      q: `What is the average salary in ${name}?`,
      a: `The average advertised salary is about ${formatSalary(sal.avgAnnual, sal.currency)} a year (Adzuna job listings, ${formatMonth(sal.avgMonth)}). Advertised salaries skew toward roles posted online, so treat this as a signal, not a guarantee.`,
    });
  }
  faqs.push({
    q: `How current is this cost data?`,
    a: `Prices and taxes were refreshed ${formatDate(OPEN_DATA_UPDATED_AT)}; inflation and the Big Mac index ${formatDate(INSIGHTS_UPDATED_AT)}. Every figure on this page shows its source. Always confirm current prices locally before you budget.`,
  });
  return faqs;
}
