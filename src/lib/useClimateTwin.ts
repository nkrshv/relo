"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClimateTwin } from "@/lib/climateTwin";

export type { ClimateTwin };

// "loading": request in flight. "ready": data available. "empty": the sources
// genuinely have nothing for this pair (404) so callers hide the block.
// "error": a transient failure (503 / network) so callers can show a Retry.
export type ClimateTwinStatus = "loading" | "ready" | "empty" | "error";

export interface ClimateTwinState {
  twin: ClimateTwin | null;
  status: ClimateTwinStatus;
  retry: () => void;
}

// Fetches the "climate twin": a home-versus-destination comparison of
// temperature, rainfall, humidity and recent air quality from
// /api/climate-twin. Exposes an explicit status so the UI can distinguish
// loading / ready / genuinely-empty / transiently-failed instead of silently
// rendering nothing. Successful payloads are cached in sessionStorage per
// route; failures are never cached, so opening the block again retries live.
export function useClimateTwin(
  fromCountry: string | undefined,
  toCountry: string | undefined,
  fromCity: string | undefined,
  toCity: string | undefined,
): ClimateTwinState {
  const [twin, setTwin] = useState<ClimateTwin | null>(null);
  const [status, setStatus] = useState<ClimateTwinStatus>("loading");
  // Bumping this re-runs the effect to force a fresh fetch (Retry button).
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!fromCountry?.trim() || !toCountry?.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTwin(null);
      setStatus("empty");
      return;
    }
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
    // Only trust the session cache on the first attempt; a Retry always goes
    // back to the network.
    if (attempt === 0) {
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) {
          setTwin(JSON.parse(raw) as ClimateTwin);
          setStatus("ready");
          return;
        }
      } catch {
        // ignore
      }
    }
    setTwin(null);
    setStatus("loading");
    let cancelled = false;
    fetch(`/api/climate-twin?${params.toString()}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as ClimateTwin;
          setTwin(data);
          setStatus("ready");
          try {
            sessionStorage.setItem(key, JSON.stringify(data));
          } catch {
            // ignore
          }
          return;
        }
        // 404 = genuinely nothing here (hide); anything else is transient.
        setStatus(res.status === 404 ? "empty" : "error");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [fromCountry, toCountry, fromCity, toCity, attempt]);

  return { twin, status, retry };
}
