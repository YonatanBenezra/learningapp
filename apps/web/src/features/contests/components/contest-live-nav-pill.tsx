"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import {
  formatCountdown,
  useDeadlineCountdown,
} from "@/features/contests/contest-clock";
import { contestsApi } from "@/features/contests/contests-api";
import type { ContestListItem } from "@/types/contest";
import { cn } from "@/lib/utils";

function isContestRoute(pathname: string) {
  return pathname === routes.contests || pathname.startsWith("/contests/");
}

export function ContestLiveNavPill() {
  const pathname = usePathname();
  const [live, setLive] = useState<ContestListItem | null>(null);

  useEffect(() => {
    if (!isContestRoute(pathname)) {
      setLive(null);
      return;
    }
    let cancelled = false;
    contestsApi
      .list()
      .then((result) => {
        if (cancelled) {
          return;
        }
        const open = result.items.find((row) => row.window === "open");
        setLive(open ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLive(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const remaining = useDeadlineCountdown(live?.windowDeadlineAt ?? null);

  if (!isContestRoute(pathname) || !live || remaining == null) {
    return null;
  }

  const shortTitle = live.title
    .replace(/^Weekly Contest #\d+\s—\s*/i, "Weekly CTF #")
    .slice(0, 24);

  return (
    <Link
      href={routes.contest(live.slug)}
      className={cn(
        "inline-flex max-w-[min(100%,20rem)] items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--arena-red)_35%,transparent)] bg-[color-mix(in_srgb,var(--arena-red)_10%,transparent)] py-[7px] pl-2.5 pr-3",
        "max-sm:max-w-none max-sm:gap-1.5 max-sm:px-2 max-sm:py-1.5",
      )}
      aria-label={`Live event ${live.title}, ${formatCountdown(remaining)} remaining`}
    >
      <span className="relative flex size-3.5 shrink-0 items-center justify-center" aria-hidden>
        <span className="absolute size-3.5 rounded-full bg-[color-mix(in_srgb,var(--arena-red)_25%,transparent)] motion-safe:animate-pulse" />
        <span className="relative size-[7px] rounded-full bg-[var(--arena-red)]" />
      </span>
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--arena-red)]">
        LIVE
      </span>
      <span className="truncate text-[13px] font-semibold text-[var(--arena-ink)] max-sm:hidden">
        {shortTitle}
      </span>
      <span
        className="hidden h-3 w-px shrink-0 bg-[color-mix(in_srgb,var(--arena-red)_35%,transparent)] sm:block"
        aria-hidden
      />
      <span className="shrink-0 font-mono text-xs text-[var(--arena-text-2)] max-sm:hidden">
        {formatCountdown(remaining)} left
      </span>
    </Link>
  );
}
