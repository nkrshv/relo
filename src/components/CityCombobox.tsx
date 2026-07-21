"use client";

import { useEffect, useId, useRef, useState } from "react";

interface CityOption {
  name: string;
  admin1?: string;
  country?: string;
}

interface Props {
  label: string;
  country: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Optional city picker backed by the Open-Meteo geocoding API (free, no key,
// CORS-enabled). Suggestions are filtered to the selected country; free text
// is also accepted since coverage of small towns varies.
export default function CityCombobox({
  label,
  country,
  value,
  onChange,
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value);
  }

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`,
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((json: { results?: CityOption[] } | null) => {
          const all = json?.results ?? [];
          const want = country.trim().toLowerCase();
          const filtered = want
            ? all.filter((r) => {
                const got = (r.country ?? "").toLowerCase();
                return got && (got.includes(want) || want.includes(got));
              })
            : all;
          setResults(filtered.slice(0, 6));
          setActive(0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, country]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function select(option: CityOption) {
    onChange(option.name);
    setQuery(option.name);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (results[active]) {
        e.preventDefault();
        select(results[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="block" ref={rootRef}>
      <span className="mb-1.5 block text-sm font-medium text-stone-700">
        {label} <span className="font-normal text-stone-500">(optional)</span>
      </span>
      <div className="relative">
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-500 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {open && query.trim().length >= 2 && (
          <div className="absolute z-30 mt-1.5 w-full rounded-lg border border-stone-200 bg-white p-1 shadow-lg reveal">
            {results.length > 0 ? (
              <ul id={listId} role="listbox" className="max-h-64 overflow-auto">
                {results.map((c, i) => {
                  const isActive = i === active;
                  return (
                    <li
                      key={`${c.name}-${c.admin1 ?? i}`}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActive(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        select(c);
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                        isActive ? "bg-stone-100 text-stone-900" : "text-stone-600"
                      }`}
                    >
                      <span>{c.name}</span>
                      {c.admin1 && (
                        <span className="truncate text-xs text-stone-500">
                          {c.admin1}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : loading ? (
              <p className="flex items-center gap-2 px-3 py-2 text-sm text-stone-500">
                <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-stone-200 border-t-stone-500" />
                Searching cities…
              </p>
            ) : (
              <p className="px-3 py-2 text-sm text-stone-500">
                No matching cities. You can type the name yourself.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
