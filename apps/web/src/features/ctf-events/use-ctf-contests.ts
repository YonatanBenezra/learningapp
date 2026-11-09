"use client";

import { useEffect, useState } from "react";
import { listArenaEvents } from "@/features/contests/arena/lib/map-api";
import type { ArenaEvent } from "@/features/contests/arena/lib/types";
import { contestListItems } from "@/features/ctf-events/contest-list-items";
import { contestsApi } from "@/features/contests/contests-api";
import type { ContestListItem } from "@/types/contest";

function sortArenaEvents(events: ArenaEvent[]) {
  const order = { live: 0, upcoming: 1, archived: 2 } as const;
  return [...events].sort((a, b) => order[a.status] - order[b.status]);
}

async function enrichLiveOperatorCounts(events: ArenaEvent[]) {
  const live = events.filter((e) => e.status === "live");
  if (live.length === 0) {
    return events;
  }
  const totals = await Promise.all(
    live.map(async (event) => {
      try {
        const board = await contestsApi.leaderboard(event.slug, 1, 1);
        return { slug: event.slug, total: board.total };
      } catch {
        return { slug: event.slug, total: 0 };
      }
    }),
  );
  const bySlug = new Map(totals.map((t) => [t.slug, t.total]));
  return events.map((e) =>
    bySlug.has(e.slug) ? { ...e, operatorCount: bySlug.get(e.slug)! } : e,
  );
}

async function enrichClosedResults(events: ArenaEvent[], items: ContestListItem[]) {
  const closedEntered = items.filter((c) => c.entered && c.window === "closed");
  if (closedEntered.length === 0) {
    return events;
  }
  const rows = await Promise.all(
    closedEntered.map(async (c) => {
      try {
        const detail = await contestsApi.getBySlug(c.slug);
        const pts = detail.totalScore ?? detail.scorecard?.totalScore;
        if (pts == null) {
          return null;
        }
        return { slug: c.slug, myResult: `${pts.toLocaleString()} pts` };
      } catch {
        return null;
      }
    }),
  );
  const bySlug = new Map(
    rows.filter((r): r is { slug: string; myResult: string } => r != null).map((r) => [r.slug, r.myResult]),
  );
  return events.map((e) => (bySlug.has(e.slug) ? { ...e, myResult: bySlug.get(e.slug) } : e));
}

export function useCtfContests() {
  const [events, setEvents] = useState<ArenaEvent[] | null>(null);
  const [apiFailed, setApiFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const applyList = (mapped: ArenaEvent[], items: ContestListItem[]) => {
      if (cancelled) {
        return;
      }
      setEvents(sortArenaEvents(mapped));
      void enrichLiveOperatorCounts(mapped)
        .then((withCounts) => enrichClosedResults(withCounts, items))
        .then((enriched) => {
          if (!cancelled) {
            setEvents(sortArenaEvents(enriched));
          }
        });
    };

    contestsApi
      .list()
      .then((result) => {
        if (cancelled) {
          return;
        }
        setApiFailed(false);
        const contests = contestListItems(result.items);
        applyList(listArenaEvents(contests), contests);
      })
      .catch(() => {
        if (!cancelled) {
          setApiFailed(true);
          setEvents([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    events,
    apiFailed,
    loading: events === null,
    error: apiFailed,
  };
}
