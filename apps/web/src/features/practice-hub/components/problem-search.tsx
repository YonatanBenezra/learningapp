"use client";

import { Search } from "lucide-react";

type ProblemSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function ProblemSearch({
  value,
  onChange,
  placeholder = "Search hands-on labs and challenges",
}: ProblemSearchProps) {
  return (
    <label className="relative mt-6 block w-full max-w-[600px]">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-platform-muted"
        aria-hidden
      />
      <span className="sr-only">Search problems</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="lp-practice-hub-search h-[38px] w-full rounded border-none bg-platform-input pl-10 pr-4 tracking-[0.01em] text-platform-text outline-none placeholder:text-platform-muted focus:ring-1 focus:ring-platform-accent/40"
      />
    </label>
  );
}
