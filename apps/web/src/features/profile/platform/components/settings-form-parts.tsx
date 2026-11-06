"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const settingsFieldClass =
  "h-11 w-full rounded-md border border-platform-border bg-platform-page px-3 text-sm text-platform-text outline-none transition-colors placeholder:text-platform-muted focus:border-platform-accent focus:ring-1 focus:ring-platform-accent/30 disabled:cursor-not-allowed disabled:opacity-60";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-platform-border bg-platform-card p-6 sm:p-7",
        className,
      )}
    >
      <header className="mb-5 border-b border-platform-border/80 pb-4">
        <h2 className="text-base font-semibold tracking-tight text-platform-text">{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-platform-muted">{description}</p>
        ) : null}
      </header>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

type SettingsFieldProps = {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
};

export function SettingsField({ label, hint, htmlFor, children }: SettingsFieldProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-start sm:gap-6">
      <div className="pt-0.5 sm:pt-2.5">
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-platform-text"
        >
          {label}
        </label>
        {hint ? <p className="mt-1 text-xs leading-relaxed text-platform-muted">{hint}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

type SettingsToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
};

export function SettingsToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: SettingsToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-platform-text">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-platform-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 disabled:opacity-50",
          checked
            ? "border-platform-accent/40 bg-platform-accent"
            : "border-platform-border bg-platform-input",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
          aria-hidden
        />
        <span className="sr-only">{label}</span>
      </button>
    </div>
  );
}
