"use client";

import { useEffect, useState } from "react";
import type { CityContext } from "@/app/api/city/route";

export type { CityContext };

// Fetches city-level context (timezone offset, AQI, Jan/Jul temps) from
// /api/city for destinations inside big countries, where capital-level
// snapshot data can be way off (Mumbai vs New Delhi, Perth vs Canberra).
// Returns null until loaded or when no city is given; callers fall back to
// the capital-level snapshot. Cached in sessionStorage per city.
export function useCityContext(
  city: string | undefined,
  country: string | undefined,
): CityContext | null {
  const [ctx, setCtx] = useState<CityContext | null>(null);

  useEffect(() => {
    if (!city?.trim() || !country?.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCtx(null);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCtx(null);
    const key = `relochecklist:city:${country.toLowerCase()}:${city.toLowerCase()}`;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        setCtx(JSON.parse(raw) as CityContext);
        return;
      }
    } catch {
      // ignore
    }
    let cancelled = false;
    fetch(
      `/api/city?city=${encodeURIComponent(city.trim())}&country=${encodeURIComponent(country.trim())}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CityContext | null) => {
        if (cancelled || !data) return;
        setCtx(data);
        try {
          sessionStorage.setItem(key, JSON.stringify(data));
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // capital-level snapshot covers this
      });
    return () => {
      cancelled = true;
    };
  }, [city, country]);

  return ctx;
}
