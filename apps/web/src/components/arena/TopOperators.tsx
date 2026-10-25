import Link from "next/link";
import { routes } from "@/config/routes";
import type { ArenaOperator } from "@/lib/arena/types";
import { cn } from "@/lib/utils";

const medalColor = {
  gold: "text-[var(--arena-medal-gold)]",
  silver: "text-[var(--arena-medal-silver)]",
  bronze: "text-[var(--arena-medal-bronze)]",
} as const;

export function TopOperators({
  operators,
  eventSlug,
}: {
  operators: ArenaOperator[];
  eventSlug?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
          TOP OPERATORS
        </h3>
        {eventSlug ? (
          <Link
            href={routes.contest(eventSlug)}
            className="font-mono text-[11.5px] text-[var(--arena-lime-fg)] hover:underline"
          >
            view all →
          </Link>
        ) : null}
      </div>
      <ul className="flex flex-col gap-2.5">
        {operators.map((row) => (
          <li
            key={row.rank}
            className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2.5"
          >
            <span
              className={cn(
                "font-mono text-[13px] font-bold",
                medalColor[row.medal],
              )}
            >
              {row.rank}
            </span>
            <span
              className="flex size-6 items-center justify-center rounded-md border font-mono text-[10px] font-bold"
              style={{
                backgroundColor: `color-mix(in srgb, var(--arena-cyan) 16%, transparent)`,
                borderColor: `color-mix(in srgb, var(--arena-cyan) 40%, transparent)`,
              }}
              aria-hidden
            >
              {row.initials}
            </span>
            <span className="truncate text-[13px] text-[var(--arena-ink)]">{row.name}</span>
            <span className="font-mono text-[13px] font-semibold text-[var(--arena-ink)]">
              {row.score.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
