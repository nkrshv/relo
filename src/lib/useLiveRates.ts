"use client";

import { useEffect, useState } from "react";

export interface RateTable {
  rates: Record<string, number>;
  updatedAt: string;
}

const CACHE_KEY = "relochecklist:liveRates";

// Fetches today's USD-based rates from open.er-api.com (free, daily refresh)
// so FX conversions stay current between monthly snapshot refreshes. Returns
// null until loaded; callers fall back to the committed snapshot. Cached in
// sessionStorage for the day to avoid refetching on every mount.
export function useLiveRates(): RateTable | null {
  const [live, setLive] = useState<RateTable | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as RateTable & { fetchedOn?: string };
        if (cached.fetchedOn === today && cached.rates) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setLive({ rates: cached.rates, updatedAt: cached.updatedAt });
          return;
        }
      }
    } catch {
      // ignore
    }
    let cancelled = false;
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then(
        (json: {
          result?: string;
          rates?: Record<string, number>;
          time_last_update_unix?: number;
        }) => {
          if (cancelled || json.result !== "success" || !json.rates) return;
          const updatedAt = json.time_last_update_unix
            ? new Date(json.time_last_update_unix * 1000)
                .toISOString()
                .slice(0, 10)
            : today;
          const table: RateTable = { rates: json.rates, updatedAt };
          setLive(table);
          try {
            sessionStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ ...table, fetchedOn: today }),
            );
          } catch {
            // ignore
          }
        },
      )
      .catch(() => {
        // snapshot fallback covers this
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return live;
}
