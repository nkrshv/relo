"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchCountries, type Country } from "@/lib/allCountries";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export default function CountryCombobox({
  label,
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Sync the visible text when the parent sets the value externally
  // (e.g. prefilled destination), using the render-time prop-change pattern.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value);
  }

  const results = useMemo<Country[]>(() => searchCountries(query), [query]);

  // Close on outside click.
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

  function select(country: Country) {
    onChange(country.name);
    setQuery(country.name);
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
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </span>
      <div className="relative">
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus={autoFocus}
          required={required}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {open && results.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1.5 max-h-64 w-full overflow-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg reveal"
          >
            {results.map((c, i) => {
              const isActive = i === active;
              return (
                <li
                  key={c.name}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(c);
                  }}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive ? "bg-zinc-100 text-zinc-900" : "text-zinc-600"
                  }`}
                >
                  <span className="text-lg leading-none">{c.emoji}</span>
                  <span>{c.name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
