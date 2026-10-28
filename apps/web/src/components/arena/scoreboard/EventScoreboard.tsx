"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { contestsApi } from "@/features/contests/contests-api";
import { mapContestLeaderboardToScoreboard } from "@/lib/arena/map-contest-scoreboard";
import { SCOREBOARD_PAGE_SIZE } from "@/lib/arena/scoreboard";
import { PodiumResponsive } from "./Podium";
import { ProgressionChart } from "./ProgressionChart";
import { ScoreboardBreadcrumb, ScoreboardHeader } from "./ScoreboardHeader";
import { ScoreTable } from "./ScoreTable";
import "./scoreboard.css";

function formatUpdatedAgo(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) {
    return `${sec}s ago`;
  }
  return `${Math.floor(sec / 60)}m ago`;
}

export function EventScoreboard({
  slug,
  eventTitle,
}: {
  slug: string;
  eventTitle?: string;
}) {
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const prevPoints = useRef<Map<number, number>>(new Map());
  const [flashRanks, setFlashRanks] = useState<Set<number>>(new Set());

  const pageQuery = useQuery({
    queryKey: ["contest-leaderboard", slug, page],
    queryFn: () => contestsApi.leaderboard(slug, page, SCOREBOARD_PAGE_SIZE),
    refetchInterval: 60_000,
  });

  const metaQuery = useQuery({
    queryKey: ["contest-leaderboard-meta", slug],
    queryFn: async () => {
      const top = await contestsApi.leaderboard(slug, 1, 5);
      return { topPodium: top.items.slice(0, 3), topChart: top.items };
    },
    refetchInterval: 60_000,
  });

  const meOnPage = pageQuery.data?.items.some((i) => i.isYou) ?? false;

  const meQuery = useQuery({
    queryKey: ["contest-leaderboard-me", slug],
    queryFn: async () => {
      const head = await contestsApi.leaderboard(slug, 1, 1);
      if (head.total === 0) {
        return null;
      }
      const cap = Math.min(head.total, 500);
      const full = await contestsApi.leaderboard(slug, 1, cap);
      return full.items.find((i) => i.isYou) ?? null;
    },
    enabled: Boolean(pageQuery.data && !meOnPage),
    refetchInterval: 60_000,
  });

  const data = useMemo(() => {
    if (!pageQuery.data || !metaQuery.data) {
      return null;
    }
    const me =
      pageQuery.data.items.find((i) => i.isYou) ??
      meQuery.data ??
      null;
    return mapContestLeaderboardToScoreboard(pageQuery.data, {
      topForPodium: metaQuery.data.topPodium,
      topForChart: metaQuery.data.topChart,
      me,
    });
  }, [pageQuery.data, metaQuery.data, meQuery.data]);

  const dataUpdatedAt = Math.max(pageQuery.dataUpdatedAt, metaQuery.dataUpdatedAt);

  useEffect(() => {
    if (!data) {
      return;
    }
    const changed = new Set<number>();
    const all = [...data.rows, data.me];
    for (const row of all) {
      const prev = prevPoints.current.get(row.rank);
      if (prev !== undefined && prev !== row.points) {
        changed.add(row.rank);
      }
      prevPoints.current.set(row.rank, row.points);
    }
    if (changed.size === 0) {
      return;
    }
    setFlashRanks(changed);
    const t = window.setTimeout(() => setFlashRanks(new Set()), 1200);
    return () => window.clearTimeout(t);
  }, [data]);

  const onFindMe = useCallback(() => {
    const el = document.getElementById("scoreboard-you-row");
    if (!el && data?.me.rank) {
      const targetPage = Math.max(1, Math.ceil(data.me.rank / SCOREBOARD_PAGE_SIZE));
      if (targetPage !== page) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(targetPage));
        window.location.assign(`?${params.toString()}`);
        return;
      }
    }
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("arena-scoreboard-flash");
    window.setTimeout(() => el?.classList.remove("arena-scoreboard-flash"), 1300);
  }, [data?.me.rank, page, searchParams]);

  const isError = pageQuery.isError || metaQuery.isError;
  const isPending = pageQuery.isPending || metaQuery.isPending;

  if (isError) {
    return (
      <div className="arena-hub arena-scoreboard px-4 py-10 text-[var(--arena-text-2)]">
        Could not load this contest&apos;s leaderboard.
      </div>
    );
  }

  if (isPending || !data) {
    return (
      <div className="arena-hub arena-scoreboard px-4 py-10" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-[color-mix(in_srgb,var(--arena-ink)_8%,transparent)]" />
      </div>
    );
  }

  const title = eventTitle ?? data.eventTitle;
  const updatedLabel = formatUpdatedAgo(Date.now() - dataUpdatedAt);

  return (
    <div className="arena-hub arena-scoreboard px-4 sm:px-0">
      <ScoreboardBreadcrumb eventTitle={title} slug={slug} />
      <ScoreboardHeader
        slug={slug}
        operatorsTotal={data.operatorsTotal}
        updatedAgoLabel={updatedLabel}
        onFindMe={onFindMe}
      />
      <div className="arena-scoreboard-top">
        <div className="arena-scoreboard-podium-wrap">
          <PodiumResponsive top3={data.top3} />
        </div>
        <div className="arena-scoreboard-chart-wrap min-h-[220px] lg:min-h-[320px]">
          <ProgressionChart series={data.series} />
        </div>
      </div>
      <ScoreTable payload={data} flashRanks={flashRanks} />
    </div>
  );
}
