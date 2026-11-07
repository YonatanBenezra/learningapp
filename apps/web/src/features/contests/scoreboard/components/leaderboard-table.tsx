"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScoreboardEntry } from "../types";
import { LeaderboardRow } from "./leaderboard-row";

type LeaderboardTableProps = {
  rows: ScoreboardEntry[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  showCountry?: boolean;
};

export function LeaderboardTable({
  rows,
  hasMore,
  loadingMore,
  onLoadMore,
  showCountry = false,
}: LeaderboardTableProps) {
  const [useInfinite, setUseInfinite] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(() => {
    if (!loadingMore && hasMore) {
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  useEffect(() => {
    if (!useInfinite) {
      return;
    }
    const node = sentinelRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [load, useInfinite]);

  return (
    <section className="lp-sb-container mt-6 pb-24" aria-label="Leaderboard">
      <div className="overflow-x-auto">
        <div className="min-w-[520px]" role="table" aria-rowcount={rows.length}>
          <div
            className={`sticky top-[64px] z-10 grid border-b border-[#232C3D] bg-[#0F1520] py-3 text-[11px] font-medium uppercase tracking-wider text-[#A4B1CD] ${
              showCountry
                ? "grid-cols-[56px_1fr_100px_88px] md:grid-cols-[80px_1fr_180px_160px_140px]"
                : "grid-cols-[56px_1fr_88px_72px] md:grid-cols-[80px_1fr_160px_140px]"
            }`}
            role="row"
          >
            <div className="text-center" role="columnheader">
              Rank
            </div>
            <div role="columnheader">Operator</div>
            {showCountry ? (
              <div className="hidden md:block" role="columnheader">
                Country
              </div>
            ) : null}
            <div role="columnheader">Points</div>
            <div role="columnheader">Flags</div>
          </div>

          {rows.map((entry) => (
            <LeaderboardRow key={`${entry.rank}-${entry.id}`} entry={entry} mobile showCountry={showCountry} />
          ))}
        </div>
      </div>

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          {useInfinite ? (
            <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
          ) : (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => {
                load();
                setUseInfinite(true);
              }}
              className="rounded-md border border-[#2A3446] px-5 py-2.5 text-[14px] font-medium text-[#A4B1CD] transition-colors hover:border-[#9FEF00] hover:text-white disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
