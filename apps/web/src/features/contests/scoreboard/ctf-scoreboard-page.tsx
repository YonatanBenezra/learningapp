"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { contestsApi } from "@/features/contests/contests-api";
import { LeaderboardTable } from "./components/leaderboard-table";
import { Podium } from "./components/podium";
import { ScoreChart } from "./components/score-chart";
import { ScoreboardEmpty } from "./components/scoreboard-empty";
import { ScoreboardError } from "./components/scoreboard-error";
import { TeamSearch } from "./components/team-search";
import { mapLeaderboardItem, mapLeaderboardPage } from "./map-leaderboard";
import type { ScoreboardEntry } from "./types";
import { ScoreboardSkeleton } from "./scoreboard-skeleton";
import "./scoreboard.css";

const PAGE_SIZE = 100;

function mergeRows(prev: ScoreboardEntry[], next: ScoreboardEntry[]): ScoreboardEntry[] {
  const byRank = new Map(prev.map((r) => [r.rank, r]));
  for (const row of next) {
    byRank.set(row.rank, row);
  }
  return [...byRank.values()].sort((a, b) => a.rank - b.rank);
}

export function CtfScoreboardPage({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);
  const [allRows, setAllRows] = useState<ScoreboardEntry[]>([]);
  const [query, setQuery] = useState("");
  const [showMe, setShowMe] = useState(false);

  const boardQuery = useQuery({
    queryKey: ["ctf-scoreboard", slug, page],
    queryFn: () => contestsApi.leaderboard(slug, page, PAGE_SIZE),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!boardQuery.data?.items.length) {
      if (boardQuery.data && boardQuery.data.total === 0 && page === 1) {
        setAllRows([]);
      }
      return;
    }
    const mapped = mapLeaderboardPage(boardQuery.data.items);
    setAllRows((prev) => (page === 1 ? mapped : mergeRows(prev, mapped)));
  }, [boardQuery.data, page]);

  const total = boardQuery.data?.total ?? allRows.length;
  const maxScore = boardQuery.data?.contest.maxScore ?? 0;
  const hasYouLoaded = allRows.some((r) => r.isYou);

  const meQuery = useQuery({
    queryKey: ["ctf-scoreboard-me", slug],
    queryFn: async () => {
      const head = await contestsApi.leaderboard(slug, 1, 1);
      if (head.total === 0) {
        return null;
      }
      const cap = Math.min(head.total, 500);
      const full = await contestsApi.leaderboard(slug, 1, cap);
      return full.items.find((i) => i.isYou) ?? null;
    },
    enabled: showMe && !hasYouLoaded && total > 0,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!meQuery.data) {
      return;
    }
    const me = mapLeaderboardItem(meQuery.data);
    setAllRows((prev) => mergeRows(prev, [me]));
  }, [meQuery.data]);

  const sortedRows = useMemo(
    () => [...allRows].sort((a, b) => a.rank - b.rank),
    [allRows],
  );

  const chartEntries = sortedRows;

  const podiumEntries = useMemo((): [
    ScoreboardEntry | undefined,
    ScoreboardEntry | undefined,
    ScoreboardEntry | undefined,
  ] => {
    const first = sortedRows.find((r) => r.rank === 1);
    const second = sortedRows.find((r) => r.rank === 2);
    const third = sortedRows.find((r) => r.rank === 3);
    return [first, second, third];
  }, [sortedRows]);

  const filteredRows = useMemo(() => {
    if (!query) {
      return sortedRows;
    }
    const q = query.toLowerCase();
    return sortedRows.filter((r) => r.name.toLowerCase().includes(q));
  }, [sortedRows, query]);

  const hasMore = sortedRows.length < total;

  const loadMore = useCallback(() => {
    if (hasMore && !boardQuery.isFetching) {
      setPage((p) => p + 1);
    }
  }, [boardQuery.isFetching, hasMore]);

  useEffect(() => {
    if (!showMe) {
      return;
    }
    const t = window.setTimeout(() => {
      document.getElementById("scoreboard-you-row")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
    return () => window.clearTimeout(t);
  }, [showMe, filteredRows, allRows]);

  const isInitialLoading = boardQuery.isPending && allRows.length === 0 && !boardQuery.isError;

  if (isInitialLoading) {
    return <ScoreboardSkeleton />;
  }

  if (boardQuery.isError && allRows.length === 0) {
    return (
      <div className="bg-[#0F1520] pb-24 text-white">
        <ScoreboardError onRetry={() => void boardQuery.refetch()} />
      </div>
    );
  }

  if (total === 0 && sortedRows.length === 0) {
    return (
      <div className="bg-[#0F1520] min-h-[50vh] pb-24 text-white">
        <ScoreboardEmpty slug={slug} />
      </div>
    );
  }

  const showCountry = sortedRows.some((r) => r.country.length === 2);

  return (
    <div className="bg-[#0F1520] pb-24 font-[family-name:var(--font-inter,Inter,sans-serif)] text-white">
      <ScoreChart entries={chartEntries} maxScore={maxScore} />

      {(podiumEntries[0] || podiumEntries[1] || podiumEntries[2]) && (
        <div className="border-t border-[#232C3D] bg-[#151C2B] pb-14 pt-4">
          <Podium entries={podiumEntries} />
        </div>
      )}

      <TeamSearch
        query={query}
        onQueryChange={setQuery}
        showMe={showMe}
        onShowMeChange={setShowMe}
        exportHref={contestsApi.leaderboardExportUrl(slug)}
        showCountryFilter={showCountry}
        country="ALL"
        countries={[]}
        onCountryChange={() => {}}
      />

      <LeaderboardTable
        rows={filteredRows}
        hasMore={hasMore}
        loadingMore={boardQuery.isFetching && page > 1}
        onLoadMore={loadMore}
        showCountry={showCountry}
      />

      {boardQuery.isFetching && page === 1 ? (
        <p className="lp-sb-container sr-only" aria-live="polite">
          Refreshing scoreboard
        </p>
      ) : null}
    </div>
  );
}
