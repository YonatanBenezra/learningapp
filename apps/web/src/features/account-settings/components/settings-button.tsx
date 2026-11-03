"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingsButtonVariant = "secondary" | "large" | "danger-ghost" | "danger-icon" | "ghost";

type SettingsButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: SettingsButtonVariant;
  loading?: boolean;
  children?: ReactNode;
};

const variantClass: Record<SettingsButtonVariant, string> = {
  secondary:
    "h-10 px-5 bg-[#242F40] text-sm font-medium text-white hover:bg-[#2a3548] disabled:text-[#526177]",
  large:
    "h-12 px-6 text-base font-medium disabled:text-[#526177]",
  "danger-ghost":
    "h-10 px-3 bg-transparent text-sm font-medium text-[#F35E5E] hover:bg-[#F35E5E]/10 disabled:text-[#526177]",
  "danger-icon":
    "size-10 bg-[#F35E5E] text-[#121C2B] hover:bg-[#f35e5e]/90 disabled:opacity-50",
  ghost:
    "h-10 px-3 bg-transparent text-sm font-medium text-white hover:bg-white/5 disabled:text-[#526177]",
};

export function SettingsButton({
  variant = "secondary",
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: SettingsButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[4px] transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]",
        "disabled:cursor-not-allowed",
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
