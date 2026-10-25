import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "lime" | "ghost";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-[0.04em] transition-[transform,box-shadow,filter] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-lime)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--arena-bg)]";

const variants: Record<Variant, string> = {
  lime: "bg-[var(--arena-lime)] text-[#070B12] shadow-[0_0_18px_color-mix(in_srgb,var(--arena-lime)_25%,transparent)] hover:-translate-y-px hover:shadow-[0_0_28px_color-mix(in_srgb,var(--arena-lime)_35%,transparent)]",
  ghost:
    "border border-[var(--arena-line-2)] bg-transparent text-[var(--arena-ink)] hover:bg-[color-mix(in_srgb,var(--arena-ink)_4%,transparent)]",
};

const sizes: Record<Size, string> = {
  md: "rounded-md px-[18px] py-3 text-[12.5px]",
  sm: "rounded-md px-3 py-[7px] text-[11.5px]",
};

export function ArenaButton({
  variant = "lime",
  size = "md",
  className,
  children,
  href,
  ...props
}: {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  href?: string;
} & ComponentPropsWithoutRef<"button">) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  const { disabled, ...buttonProps } = props;
  return (
    <button
      type="button"
      className={cn(classes, disabled && "pointer-events-none opacity-55")}
      disabled={disabled}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
