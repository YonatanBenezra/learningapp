"use client";

import { ChevronDown, Globe, Loader2, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchCountries,
  findCountryByName,
  type CountryOption,
} from "@/lib/countries-api";
import { cn } from "@/lib/utils";

export const COUNTRY_SELECT_FIELD =
  "h-11 w-full rounded-md border border-platform-border bg-platform-page px-3 text-sm text-platform-text outline-none transition-colors focus:border-platform-accent focus:ring-1 focus:ring-platform-accent/30";

type CountrySelectProps = {
  value: string;
  onChange: (countryName: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
};

export function CountrySelect({
  value,
  onChange,
  disabled,
  className,
  id: idProp,
  placeholder = "Select your country",
}: CountrySelectProps) {
  const autoId = useId();
  const listId = `${autoId}-list`;
  const id = idProp ?? autoId;

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchCountries();
        if (!cancelled) {
          setCountries(list);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Country list unavailable. Try again later.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => findCountryByName(countries, value),
    [countries, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [countries, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  function pick(country: CountryOption) {
    onChange(country.name);
    close();
  }

  const displayLabel = selected?.name ?? (value.trim() || placeholder);
  const showLegacyValue = !selected && value.trim().length > 0;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          COUNTRY_SELECT_FIELD,
          "lp-country-select-btn flex items-center justify-between gap-2 text-left",
          !value.trim() && "text-platform-muted",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-platform-muted" aria-hidden />
          ) : selected ? (
            <span className="text-base leading-none" aria-hidden>
              {selected.flag}
            </span>
          ) : showLegacyValue ? (
            <Globe className="size-4 shrink-0 text-platform-muted" aria-hidden />
          ) : (
            <Globe className="size-4 shrink-0 text-platform-muted" aria-hidden />
          )}
          <span className="truncate">{showLegacyValue ? value : displayLabel}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-platform-muted transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {loadError ? (
        <p className="mt-1.5 text-xs text-platform-danger">{loadError}</p>
      ) : null}

      {open && !loadError ? (
        <div
          className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-md border border-platform-border bg-platform-card shadow-xl shadow-black/40"
          role="presentation"
        >
          <div className="border-b border-platform-border p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-platform-muted"
                aria-hidden
              />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search countries…"
                className="h-9 w-full rounded border border-platform-border bg-platform-page pl-9 pr-3 text-sm text-platform-text outline-none focus:border-platform-accent"
                autoComplete="off"
              />
            </div>
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={id}
            className="max-h-56 overflow-y-auto py-1 [-ms-overflow-style:none] [scrollbar-width:thin]"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-platform-muted">No matches</li>
            ) : (
              filtered.map((country) => {
                const active = country.name === selected?.name;
                return (
                  <li key={country.code} role="option" aria-selected={active}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                        active
                          ? "bg-platform-accent/10 text-platform-text"
                          : "text-platform-text hover:bg-platform-input",
                      )}
                      onClick={() => pick(country)}
                    >
                      <span className="text-base leading-none" aria-hidden>
                        {country.flag}
                      </span>
                      <span className="flex-1 truncate">{country.name}</span>
                      <span className="text-xs font-medium uppercase text-platform-muted">
                        {country.code}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
