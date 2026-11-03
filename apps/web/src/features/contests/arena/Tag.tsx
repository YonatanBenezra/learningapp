import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TagTone =
  | "live"
  | "solo"
  | "advanced"
  | "cyan"
  | "archived"
  | "played"
  | "upcoming"
  | "insane";

const toneClass: Record<TagTone, string> = {
  live: "border-[color-mix(in_srgb,var(--arena-red)_30%,transparent)] bg-[color-mix(in_srgb,var(--arena-red)_12%,transparent)] text-[var(--arena-red)]",
  solo: "border-[var(--arena-line)] bg-[color-mix(in_srgb,var(--arena-ink)_6%,transparent)] text-[var(--arena-text-2)]",
  advanced:
    "border-[color-mix(in_srgb,var(--arena-amber)_30%,transparent)] bg-[color-mix(in_srgb,var(--arena-amber)_12%,transparent)] text-[var(--arena-amber)]",
  cyan: "border-[color-mix(in_srgb,var(--arena-cyan)_30%,transparent)] bg-[color-mix(in_srgb,var(--arena-cyan)_12%,transparent)] text-[var(--arena-cyan)]",
  upcoming:
    "border-[color-mix(in_srgb,var(--arena-cyan)_30%,transparent)] bg-[color-mix(in_srgb,var(--arena-cyan)_12%,transparent)] text-[var(--arena-cyan)]",
  archived:
    "border-[var(--arena-line)] bg-[color-mix(in_srgb,var(--arena-ink)_6%,transparent)] text-[var(--arena-text-2)]",
  played:
    "border-[color-mix(in_srgb,var(--arena-lime-fg)_30%,transparent)] bg-[color-mix(in_srgb,var(--arena-lime-fg)_12%,transparent)] text-[var(--arena-lime-fg)]",
  insane:
    "border-[color-mix(in_srgb,var(--arena-purple)_30%,transparent)] bg-[color-mix(in_srgb,var(--arena-purple)_12%,transparent)] text-[var(--arena-purple)]",
};

export function Tag({
  tone,
  children,
  dot,
  icon,
  className,
}: {
  tone: TagTone;
  children: ReactNode;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-[7px] py-[3px] font-mono text-[10.5px] font-bold uppercase tracking-[0.08em]",
        toneClass[tone],
        className,
      )}
    >
      {dot ? (
        <span
          className="size-1.5 shrink-0 rounded-full bg-[var(--arena-red)]"
          aria-hidden
        />
      ) : null}
      {icon}
      {children}
    </span>
  );
}
