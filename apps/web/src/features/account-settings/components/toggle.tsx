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
    <div className="flex items-center gap-3">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5",
          "transition-colors duration-200",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]",
          checked ? "bg-[#9FEF00]" : "bg-[#3A4559]",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "pointer-events-none block size-5 shrink-0 rounded-full bg-[#F4F4F4]",
            "shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out",
            checked ? "translate-x-5" : "translate-x-0",
          )}
          aria-hidden
        />
      </button>
      <span className="text-sm font-medium text-[#F4F4F4]">{label}</span>
    </div>
  );
}
