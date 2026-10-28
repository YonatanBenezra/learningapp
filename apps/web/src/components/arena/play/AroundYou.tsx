import Link from "next/link";
import { Zap } from "lucide-react";
import { routes } from "@/config/routes";
import { avatarColorForName } from "@/lib/arena/categories";
import type { AroundYouRow } from "@/lib/arena/play-types";
import { cn } from "@/lib/utils";

export function AroundYou({
  rows,
  contestSlug,
}: {
  rows: AroundYouRow[];
  contestSlug: string;
}) {
  const youIdx = rows.findIndex((r) => r.isYou);
  const ahead = youIdx > 0 ? rows[youIdx - 1] : null;
  const you = rows[youIdx];
  const hint =
    ahead && you
      ? `+${(ahead.score - you.score + 1).toLocaleString()} pts to pass ${ahead.name}`
      : "+56 pts to pass nusrat.k";

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--arena-line)] px-4 py-3.5">
        <h2 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
          Around you
        </h2>
        <Link
          href={routes.contestScoreboard(contestSlug)}
          className="font-mono text-[11.5px] text-[var(--arena-lime-fg)] hover:underline"
        >
          board →
        </Link>
      </div>
      <ul>
        {rows.map((row) => (
          <li
            key={row.rank}
            className={cn(
              "flex h-10 items-center gap-2 border-t border-[var(--arena-line)] px-4",
              row.isYou &&
                "border-l-[3px] border-l-[var(--arena-lime-fg)] bg-[color-mix(in_srgb,var(--arena-lime)_7%,transparent)] pl-[calc(1rem-3px)]",
            )}
          >
            <span
              className={cn(
                "w-10 font-mono text-[13px] font-bold",
                row.isYou ? "text-[var(--arena-lime-fg)]" : "text-[var(--arena-text-2)]",
              )}
            >
              {row.rank}
            </span>
            <span
              className="flex size-[26px] shrink-0 items-center justify-center rounded-md border font-mono text-[9px] font-bold"
              style={{
                color: avatarColorForName(row.name),
                backgroundColor: `color-mix(in srgb, ${avatarColorForName(row.name)} 16%, transparent)`,
                borderColor: `color-mix(in srgb, ${avatarColorForName(row.name)} 40%, transparent)`,
              }}
            >
              {row.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--arena-ink)]">
              {row.name}
              {row.isYou ? (
                <span className="ml-1.5 rounded bg-[var(--arena-lime)] px-1 py-0.5 font-mono text-[9px] font-bold uppercase text-[var(--color-brand-on)]">
                  you
                </span>
              ) : null}
            </span>
            <span className="w-[70px] text-right font-mono text-[13.5px] font-bold text-[var(--arena-ink)]">
              {row.score.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
      <p className="flex items-center justify-center gap-1.5 border-t border-[var(--arena-line)] bg-[color-mix(in_srgb,var(--arena-lime)_4%,transparent)] px-4 py-3 text-center text-xs font-medium text-[var(--arena-text-2)]">
        <Zap className="size-[13px] text-[var(--arena-lime-fg)]" aria-hidden />
        {hint}
      </p>
    </section>
  );
}
