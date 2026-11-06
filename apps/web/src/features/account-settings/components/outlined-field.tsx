"use client";

import { ChevronDown } from "lucide-react";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const labelFloatClass =
  "pointer-events-none absolute left-3 z-[1] bg-[#151F2E] px-1 text-xs leading-none text-[#8799B5] transition-all duration-150";

const labelUp = "-top-2 translate-y-0 text-xs";
const labelDown =
  "top-1/2 -translate-y-1/2 text-sm peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-xs";

type OutlinedFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const OutlinedField = forwardRef<HTMLInputElement, OutlinedFieldProps>(
  function OutlinedField({ label, error, className, id, ...props }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;

    return (
      <div className={cn("relative pt-1", className)}>
        <input
          ref={ref}
          id={fieldId}
          placeholder=" "
          className={cn(
            "peer h-12 w-full rounded-[4px] border bg-transparent px-4 pb-2 pt-5 text-base leading-tight text-[#F4F4F4] outline-none transition-colors",
            error ? "border-[#F35E5E]" : "border-[#3A4559] hover:border-[#8799B5] focus:border-[#9FEF00]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]",
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        />
        <label
          htmlFor={fieldId}
          className={cn(
            labelFloatClass,
            labelDown,
            "peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs",
          )}
        >
          {label}
        </label>
        {error ? (
          <p id={`${fieldId}-error`} className="mt-1.5 min-h-[18px] text-xs text-[#F35E5E]">
            {error}
          </p>
        ) : (
          <span className="mt-1.5 block min-h-[18px]" aria-hidden />
        )}
      </div>
    );
  },
);

type OutlinedSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
};

export const OutlinedSelect = forwardRef<HTMLSelectElement, OutlinedSelectProps>(
  function OutlinedSelect({ label, error, options, className, id, ...props }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;

    return (
      <div className={cn("relative pt-1", className)}>
        <select
          ref={ref}
          id={fieldId}
          className={cn(
            "h-12 w-full appearance-none rounded-[4px] border bg-transparent py-0 pl-4 pr-10 text-base leading-normal text-[#F4F4F4] outline-none transition-colors",
            error ? "border-[#F35E5E]" : "border-[#3A4559] hover:border-[#8799B5] focus:border-[#9FEF00]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]",
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#151F2E]">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-[calc(50%+2px)] size-4 -translate-y-1/2 text-[#8799B5]"
          aria-hidden
        />
        <label htmlFor={fieldId} className={cn(labelFloatClass, labelUp)}>
          {label}
        </label>
        {error ? (
          <p className="mt-1.5 min-h-[18px] text-xs text-[#F35E5E]">{error}</p>
        ) : (
          <span className="mt-1.5 block min-h-[18px]" aria-hidden />
        )}
      </div>
    );
  },
);
