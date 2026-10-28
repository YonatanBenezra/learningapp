"use client";

import Link from "next/link";
import { Activity, ChevronRight, Download, Search } from "lucide-react";
import { ArenaButton } from "@/components/arena/ArenaButton";
import { Tag } from "@/components/arena/Tag";
import { routes } from "@/config/routes";
import { contestsApi } from "@/features/contests/contests-api";

export function ScoreboardBreadcrumb({
  eventTitle,
  slug,
}: {
  eventTitle: string;
  slug: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1.5">
      <Link
        href={routes.contests}
        className="text-[12.5px] text-[var(--arena-text-3)] transition-colors hover:text-[var(--arena-text-2)]"
      >
        Arena
      </Link>
      <ChevronRight className="size-3 shrink-0 text-[var(--arena-text-3)]" aria-hidden />
      <Link
        href={routes.contestPlay(slug)}
        className="max-w-[min(100%,280px)] truncate text-[12.5px] text-[var(--arena-text-3)] transition-colors hover:text-[var(--arena-text-2)]"
      >
        {eventTitle}
      </Link>
      <ChevronRight className="size-3 shrink-0 text-[var(--arena-text-3)]" aria-hidden />
      <span className="text-[12.5px] text-[var(--arena-ink)]">Scoreboard</span>
    </nav>
  );
}

export function ScoreboardHeader({
  slug,
  operatorsTotal,
  updatedAgoLabel,
  onFindMe,
}: {
  slug: string;
  operatorsTotal: number;
  updatedAgoLabel: string;
  onFindMe: () => void;
}) {
  return (
    <div className="arena-scoreboard-header-row flex flex-wrap items-end justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="live" dot>
            LIVE
          </Tag>
          <Tag tone="solo">{operatorsTotal} OPERATORS</Tag>
          <Tag
            tone="cyan"
            icon={<Activity className="size-[11px]" aria-hidden />}
          >
            REFRESH 60S
          </Tag>
          <span className="font-mono text-[11px] text-[var(--arena-text-3)]">
            Updated {updatedAgoLabel}
          </span>
        </div>
        <h1 className="text-[30px] font-bold tracking-[-0.025em] text-[var(--arena-ink)] sm:text-[38px]">
          Scoreboard
        </h1>
        <p
          id="scoreboard-tiebreak"
          className="max-w-xl text-[14.5px] leading-[1.55] text-[var(--arena-text-2)]"
        >
          Ranked by points, ties broken by earliest last capture. First bloods are marked with a
          drop.
        </p>
      </div>
      <div className="arena-scoreboard-header-actions shrink-0">
        <ArenaButton
          variant="ghost"
          size="sm"
          href={contestsApi.leaderboardExportUrl(slug)}
          className="gap-1.5"
        >
          <Download className="size-[13px]" aria-hidden />
          Export csv
        </ArenaButton>
        <ArenaButton
          variant="subtle"
          size="sm"
          className="gap-1.5"
          onClick={onFindMe}
        >
          <Search className="size-[13px]" aria-hidden />
          Find me
        </ArenaButton>
      </div>
    </div>
  );
}
