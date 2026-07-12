"use client";

import { useEffect, useState } from "react";
import type { ClimateTwin } from "@/lib/climateTwin";

export type { ClimateTwin };

// Fetches the "climate twin": a home-versus-destination comparison of
// temperature, rainfall, humidity and recent air quality from
// /api/climate-twin. Returns null until loaded or when the block has no data,
// so callers simply render nothing. Cached in sessionStorage per route.
export function useClimateTwin(
  fromCountry: string | undefined,
  toCountry: string | undefined,
  fromCity: string | undefined,
  toCity: string | undefined,
): ClimateTwin | null {
  const [twin, setTwin] = useState<ClimateTwin | null>(null);

  useEffect(() => {
    if (!fromCountry?.trim() || !toCountry?.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTwin(null);
      return;
    }
    setTwin(null);
    const params = new URLSearchParams({
      fromCountry: fromCountry.trim(),
      toCountry: toCountry.trim(),
    });
    if (fromCity?.trim()) params.set("fromCity", fromCity.trim());
    if (toCity?.trim()) params.set("toCity", toCity.trim());
    // Bump the version segment whenever the ClimateTwin schema changes so a
    // stale cached payload (e.g. from before sunnyDays existed) is discarded
    // instead of surfacing undefined fields.
    const key = `relochecklist:climate-twin:v2:${params.toString().toLowerCase()}`;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        setTwin(JSON.parse(raw) as ClimateTwin);
        return;
      }
    } catch {
      // ignore
    }
    let cancelled = false;
    fetch(`/api/climate-twin?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ClimateTwin | null) => {
        if (cancelled || !data) return;
        setTwin(data);
        try {
          sessionStorage.setItem(key, JSON.stringify(data));
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // block just stays hidden
      });
    return () => {
      cancelled = true;
    };
  }, [fromCountry, toCountry, fromCity, toCity]);

  return twin;
}
