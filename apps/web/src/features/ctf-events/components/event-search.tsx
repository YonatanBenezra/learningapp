"use client";

import { Search } from "lucide-react";

type EventSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function EventSearch({
  value,
  onChange,
  placeholder = "Search live capture the flag events",
}: EventSearchProps) {
  return (
    <label className="relative mt-6 block w-full max-w-[600px]">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-platform-muted"
        aria-hidden
      />
      <span className="sr-only">Search events</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[38px] w-full rounded border-none bg-platform-input pl-10 pr-4 text-sm tracking-[0.14px] text-platform-text outline-none placeholder:text-platform-muted focus:ring-1 focus:ring-platform-accent/40"
      />
    </label>
  );
}
