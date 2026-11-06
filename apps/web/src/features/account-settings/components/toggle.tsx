"use client";

import { cn } from "@/lib/utils";

type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
};

export function Toggle({ checked, onChange, label, disabled, id }: ToggleProps) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors duration-200",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]",
          checked ? "bg-[#9FEF00]" : "bg-[#3A4559]",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-[#121C2B] shadow transition-transform duration-200",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
          aria-hidden
        />
      </button>
      <span className="text-sm font-medium text-[#F4F4F4]">{label}</span>
    </div>
  );
}
