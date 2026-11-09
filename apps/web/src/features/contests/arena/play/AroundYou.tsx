import Link from "next/link";
import { routes } from "@/config/routes";
import type { AroundYouRow } from "@/features/contests/arena/lib/play-types";
import { cn } from "@/lib/utils";

export function AroundYou({
  rows,
  contestSlug,
  embedded,
}: {
  rows: AroundYouRow[];
  contestSlug: string;
  embedded?: boolean;
}) {
  const youIdx = rows.findIndex((r) => r.isYou);
  const ahead = youIdx > 0 ? rows[youIdx - 1] : null;
  const you = youIdx >= 0 ? rows[youIdx] : null;
  const hint =
    ahead && you
      ? `+${(ahead.score - you.score + 1).toLocaleString()} pts to pass ${ahead.name}`
      : null;

  return (
    <section
      className={cn(
        "overflow-hidden bg-[#151C2B]",
        !embedded && "rounded-sm border border-[#232C3D]",
      )}
    >
      {embedded ? null : (
        <div className="flex h-12 items-center justify-between gap-2 px-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7891]">
            Around you
          </h2>
          <Link
            href={routes.contestScoreboard(contestSlug)}
            className="text-xs text-[#6B7891] transition-colors hover:text-[#A4B1CD]"
          >
            Scoreboard →
          </Link>
        </div>
      )}
      <ul>
        {rows.length === 0 ? (
          <li className="border-t border-[#232C3D] px-5 py-8 text-center text-sm text-[#6B7891]">
            Join and climb the board to see operators near your rank.
          </li>
        ) : null}
        {rows.map((row) => (
          <li
            key={row.rank}
            className={cn(
              "relative flex h-11 items-center gap-3 border-t border-[#232C3D] px-5",
              row.isYou && "bg-[#9FEF00]/[0.03]",
            )}
          >
            {row.isYou ? (
              <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#9FEF00]/70" aria-hidden />
            ) : null}
            <span
              className={cn(
                "w-7 font-mono text-sm tabular-nums",
                row.isYou ? "text-[#9FEF00]" : "text-[#6B7891]",
              )}
            >
              {row.rank}
            </span>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1C2537] text-[10px] font-medium text-[#A4B1CD]">
              {row.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-sm text-[#A4B1CD]">
              {row.name}
              {row.isYou ? (
                <span className="shrink-0 rounded border border-[#9FEF00]/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#9FEF00]">
                  You
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                "font-mono text-sm tabular-nums",
                row.isYou ? "text-[#9FEF00]" : "text-[#A4B1CD]",
              )}
            >
              {row.score.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
      {hint ? (
        <p className="border-t border-[#232C3D] py-2.5 text-center text-xs text-[#6B7891]">{hint}</p>
      ) : null}
    </section>
  );
}
