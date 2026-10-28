"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutGroup } from "motion/react";
import type { ScoreboardPayload } from "@/lib/arena/scoreboard";
import { SCOREBOARD_PAGE_SIZE } from "@/lib/arena/scoreboard";
import { ScoreMobileCard, ScoreTableRow } from "./ScoreRow";
import { cn } from "@/lib/utils";

function pageHref(pathname: string, page: number, params: URLSearchParams) {
  const next = new URLSearchParams(params);
  if (page <= 1) {
    next.delete("page");
  } else {
    next.set("page", String(page));
  }
  const q = next.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function ScoreTable({
  payload,
  flashRanks,
}: {
  payload: ScoreboardPayload;
  flashRanks: Set<number>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { rows, me, total, page } = payload;

  const hasMe = me.rank > 0;
  const meOnPage = hasMe && rows.some((r) => r.rank === me.rank);
  const showYouPin = hasMe && !meOnPage;
  const lastRank = rows.at(-1)?.rank ?? 0;
  const gapCount = showYouPin ? me.rank - lastRank - 1 : 0;

  const start = (page - 1) * SCOREBOARD_PAGE_SIZE + 1;
  const end = start + rows.length - 1;
  const totalPages = Math.max(1, Math.ceil(total / SCOREBOARD_PAGE_SIZE));

  const pageNumbers = useMemo(() => buildPageList(page, totalPages), [page, totalPages]);

  return (
    <section
      className="overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)]"
      aria-describedby="scoreboard-tiebreak"
    >
      <div className="arena-scoreboard-mobile-cards">
        <LayoutGroup>
          {rows.map((row) => (
            <ScoreMobileCard
              key={row.rank}
              row={row}
              pointsFlash={flashRanks.has(row.rank)}
            />
          ))}
        </LayoutGroup>
        {showYouPin ? (
          <ScoreMobileCard row={me} pointsFlash={flashRanks.has(me.rank)} />
        ) : null}
      </div>

      <div className="arena-scoreboard-desktop-table arena-scoreboard-table-scroll max-h-[min(70vh,640px)] overflow-y-auto">
        <table className="arena-scoreboard-table">
          <thead>
            <tr>
              <th scope="col" className="col-rank">
                Rank
              </th>
              <th scope="col" className="col-operator">
                Operator
              </th>
              <th scope="col" className="col-points">
                Points
              </th>
              <th scope="col" className="col-flags">
                Flags
              </th>
              <th scope="col" className="col-bloods">
                Bloods
              </th>
              <th scope="col" className="col-capture">
                Last capture
              </th>
              <th scope="col" className="col-categories">
                Categories
              </th>
            </tr>
          </thead>
          <tbody>
            <LayoutGroup>
              {rows.map((row) => (
                <ScoreTableRow
                  key={row.rank}
                  row={row}
                  layoutId={`rank-${row.rank}`}
                  pointsFlash={flashRanks.has(row.rank)}
                />
              ))}
              {gapCount > 0 ? (
                <tr className="arena-scoreboard-gap-row">
                  <td colSpan={7} className="!py-2 text-center">
                    <span className="font-mono text-[11px] text-[var(--arena-text-3)]">
                      · · · {gapCount} more · · ·
                    </span>
                  </td>
                </tr>
              ) : null}
              {showYouPin ? (
                <ScoreTableRow
                  row={me}
                  variant="you"
                  layoutId={`rank-${me.rank}`}
                  pointsFlash={flashRanks.has(me.rank)}
                  rowId="scoreboard-you-row"
                />
              ) : null}
            </LayoutGroup>
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-[var(--arena-line)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-[var(--arena-text-3)]">
          Showing {start}–{end} of {total}
          {hasMe ? ` · you are #${me.rank}` : " · join the contest to appear on this board"}
        </p>
        <nav aria-label="Scoreboard pagination" className="flex items-center gap-1">
          <PageLink
            href={pageHref(pathname, page - 1, searchParams)}
            disabled={page <= 1}
            label="Previous page"
          >
            ←
          </PageLink>
          {pageNumbers.map((n, i) =>
            n === "…" ? (
              <span key={`ellipsis-${i}`} className="px-1 font-mono text-xs text-[var(--arena-text-3)]">
                …
              </span>
            ) : (
              <Link
                key={n}
                href={pageHref(pathname, n, searchParams)}
                className={cn(
                  "min-w-[28px] rounded px-1.5 py-0.5 text-center font-mono text-xs",
                  n === page
                    ? "bg-[color-mix(in_srgb,var(--arena-ink)_8%,transparent)] text-[var(--arena-ink)]"
                    : "text-[var(--arena-text-2)] hover:text-[var(--arena-ink)]",
                )}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </Link>
            ),
          )}
          <PageLink
            href={pageHref(pathname, page + 1, searchParams)}
            disabled={page >= totalPages}
            label="Next page"
          >
            →
          </PageLink>
        </nav>
      </footer>
    </section>
  );
}

function PageLink({
  href,
  disabled,
  children,
  label,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
  label: string;
}) {
  if (disabled) {
    return (
      <span
        className="min-w-[28px] px-1.5 py-0.5 text-center font-mono text-xs text-[var(--arena-text-3)] opacity-40"
        aria-hidden
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="min-w-[28px] px-1.5 py-0.5 text-center font-mono text-xs text-[var(--arena-text-2)] hover:text-[var(--arena-ink)]"
      aria-label={label}
    >
      {children}
    </Link>
  );
}

function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | "…")[] = [1];
  if (current > 3) {
    items.push("…");
  }
  const midStart = Math.max(2, current - 1);
  const midEnd = Math.min(total - 1, current + 1);
  for (let p = midStart; p <= midEnd; p += 1) {
    if (!items.includes(p)) {
      items.push(p);
    }
  }
  if (current < total - 2) {
    items.push("…");
  }
  if (!items.includes(total)) {
    items.push(total);
  }
  return items;
}
