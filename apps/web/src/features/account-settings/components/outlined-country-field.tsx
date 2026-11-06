"use client";

import { CountrySelect } from "@/components/ui/country-select";
import { cn } from "@/lib/utils";

type OutlinedCountryFieldProps = {
  value: string;
  onChange: (countryName: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
};

export function OutlinedCountryField({
  value,
  onChange,
  disabled,
  error,
  label = "Country",
}: OutlinedCountryFieldProps) {
  return (
    <div className="relative pt-1">
      <span
        className="pointer-events-none absolute left-3 top-0 z-[2] bg-[#151F2E] px-1 text-xs leading-none text-[#8799B5]"
        aria-hidden
      >
        {label}
      </span>
      <CountrySelect
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder="Select country"
        className={cn(
          "[&_.lp-country-select-btn]:h-12 [&_.lp-country-select-btn]:rounded-[4px]",
          "[&_.lp-country-select-btn]:border-[#3A4559] [&_.lp-country-select-btn]:bg-transparent",
          "[&_.lp-country-select-btn]:pt-4 [&_.lp-country-select-btn]:text-base [&_.lp-country-select-btn]:text-[#F4F4F4]",
          "[&_.lp-country-select-btn]:hover:border-[#8799B5] [&_.lp-country-select-btn]:focus:border-[#9FEF00]",
          error && "[&_.lp-country-select-btn]:border-[#F35E5E]",
        )}
      />
      {error ? (
        <p className="mt-1.5 min-h-[18px] text-xs text-[#F35E5E]">{error}</p>
      ) : (
        <span className="mt-1.5 block min-h-[18px]" aria-hidden />
      )}
    </div>
  );
}
