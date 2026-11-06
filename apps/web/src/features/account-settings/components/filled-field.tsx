"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type FilledFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  leftIcon?: ReactNode;
  error?: string;
};

export const FilledField = forwardRef<HTMLInputElement, FilledFieldProps>(function FilledField(
  { label, leftIcon, error, className, id, ...props },
  ref,
) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-[#F4F4F4]">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8799B5]">
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-10 w-full rounded-[4px] bg-[#1E2939] text-sm text-[#F4F4F4] outline-none transition-colors",
            "placeholder:text-[#526177]",
            leftIcon ? "pl-10 pr-4" : "px-4",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]",
            error && "ring-1 ring-[#F35E5E]",
          )}
          {...props}
        />
      </div>
      {error ? <p className="mt-1.5 text-xs text-[#F35E5E]">{error}</p> : null}
    </div>
  );
});
