import { formatRange, type CityCost, type MoneyRange } from "@/lib/costOfLiving";

// The budget rows we render for a city, in display order.
const ROWS: { key: keyof CityCost; label: string }[] = [
  { key: "rent1brCenter", label: "Rent · 1-bed, city centre" },
  { key: "rent1brOutside", label: "Rent · 1-bed, outside centre" },
  { key: "rent3brCenter", label: "Rent · 3-bed, city centre" },
  { key: "utilitiesBasic", label: "Utilities (electric, water, gas)" },
  { key: "internet", label: "Home internet" },
  { key: "mobilePlan", label: "Mobile plan" },
  { key: "groceriesSingle", label: "Groceries · one adult" },
  { key: "mealInexpensive", label: "Meal · inexpensive restaurant" },
  { key: "mealMidForTwo", label: "Dinner for two · mid-range" },
  { key: "publicTransportPass", label: "Monthly transit pass" },
];

export function cityTierLabel(tier: CityCost["tier"]): string {
  return tier === "capital"
    ? "Capital"
    : tier === "popular_expat"
      ? "Popular with expats"
      : "Major city";
}

export default function CityBudget({
  city,
  currency,
  showCityName = true,
}: {
  city: CityCost;
  currency: string;
  showCityName?: boolean;
}) {
  const rows = ROWS.filter(
    (r) => city[r.key] && typeof city[r.key] === "object",
  );
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      {showCityName && (
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-stone-900">{city.city}</h3>
          <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
            {cityTierLabel(city.tier)}
          </span>
        </div>
      )}
      <dl className={`${showCityName ? "mt-3" : ""} divide-y divide-stone-200/70`}>
        {rows.map((r) => {
          const m = city[r.key] as MoneyRange;
          return (
            <div
              key={r.key}
              className="flex items-baseline justify-between gap-4 py-2 text-sm"
            >
              <dt className="text-stone-600">{r.label}</dt>
              <dd className="tnum text-right font-medium text-stone-900">
                {formatRange(m.usd, "USD")}
                <span className="ml-1 text-xs font-normal text-stone-500">
                  ({formatRange(m.local, currency)})
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
      {(city.monthlyBudgetSingle || city.monthlyBudgetFamily4) && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {city.monthlyBudgetSingle && (
            <div className="rounded-lg bg-stone-50 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                Monthly budget · single
              </p>
              <p className="tnum mt-0.5 text-base font-semibold text-stone-900">
                {formatRange(city.monthlyBudgetSingle.usd, "USD")}
              </p>
            </div>
          )}
          {city.monthlyBudgetFamily4 && (
            <div className="rounded-lg bg-stone-50 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                Monthly budget · family of four
              </p>
              <p className="tnum mt-0.5 text-base font-semibold text-stone-900">
                {formatRange(city.monthlyBudgetFamily4.usd, "USD")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
