"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterCheckbox({
  checked,
  onChange,
  label,
  dotColor,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm text-[#A4B1CD] transition-colors hover:bg-[#151C2B]"
    >
      <span
        className={cn(
          "inline-flex size-4 shrink-0 items-center justify-center rounded border",
          checked
            ? "border-[#9FEF00] bg-[#9FEF00]/15"
            : "border-[#2A3446] bg-transparent",
        )}
      >
        {checked ? <Check className="size-3 text-[#9FEF00]" strokeWidth={3} /> : null}
      </span>
      {dotColor ? (
        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} aria-hidden />
      ) : null}
      {label}
    </button>
  );
}
