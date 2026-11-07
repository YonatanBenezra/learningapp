"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ChevronDown, Download, Search } from "lucide-react";

type TeamSearchProps = {
  query: string;
  onQueryChange: (q: string) => void;
  countries: string[];
  country: string;
  onCountryChange: (c: string) => void;
  showMe: boolean;
  onShowMeChange: (v: boolean) => void;
  exportHref: string;
  showCountryFilter?: boolean;
};

export function TeamSearch({
  query,
  onQueryChange,
  countries,
  country,
  onCountryChange,
  showMe,
  onShowMeChange,
  exportHref,
  showCountryFilter = false,
}: TeamSearchProps) {
  const [draft, setDraft] = useState(query);
  const toggleId = useId();

  useEffect(() => {
    const t = window.setTimeout(() => onQueryChange(draft.trim()), 250);
    return () => window.clearTimeout(t);
  }, [draft, onQueryChange]);

  const countryOptions = useMemo(
    () => ["ALL", ...countries.filter((c) => c !== "ALL").sort()],
    [countries],
  );

  return (
    <section className="lp-sb-container mt-12 flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative min-w-0 flex-1">
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search operators"
          className="h-11 w-full rounded-md border border-[#2A3446] bg-transparent px-3 pr-10 text-[14px] text-white placeholder:text-[#6B7891] focus:border-[#9FEF00] focus:outline-none focus:ring-2 focus:ring-[#9FEF00]/20"
          aria-label="Search operators"
        />
        <Search
          className="pointer-events-none absolute right-3 top-1/2 size-[18px] -translate-y-1/2 text-[#6B7891]"
          aria-hidden
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 md:shrink-0">
        {showCountryFilter ? (
          <label className="flex items-center gap-2 text-[13px] text-[#A4B1CD]">
            <span className="sr-only">Filter by country</span>
            <div className="relative">
              <select
                value={country}
                onChange={(e) => onCountryChange(e.target.value)}
                className="h-11 min-w-[120px] appearance-none rounded-md border border-[#2A3446] bg-[#151C2B] pl-3 pr-9 text-[14px] text-white focus:border-[#9FEF00] focus:outline-none focus:ring-2 focus:ring-[#9FEF00]/20"
              >
                {countryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c === "ALL" ? "All countries" : c}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#6B7891]"
                aria-hidden
              />
            </div>
          </label>
        ) : null}

        <a
          href={exportHref}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-[#2A3446] px-3 text-[13px] font-medium text-[#A4B1CD] transition-colors hover:border-[#9FEF00] hover:text-white"
        >
          <Download className="size-4" aria-hidden />
          Export CSV
        </a>

        <label htmlFor={toggleId} className="flex cursor-pointer items-center gap-2 text-[13px] text-[#A4B1CD]">
          <span>Show me</span>
          <button
            id={toggleId}
            type="button"
            role="switch"
            aria-checked={showMe}
            onClick={() => onShowMeChange(!showMe)}
            className={`relative h-6 w-11 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00] ${
              showMe ? "border-[#9FEF00]/50 bg-[#9FEF00]/20" : "border-[#2A3446] bg-[#0F1520]"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] ${
                showMe ? "left-[22px] bg-[#9FEF00]" : "left-0.5"
              }`}
            />
          </button>
        </label>
      </div>
    </section>
  );
}
