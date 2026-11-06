"use client";

import { useEffect, useState } from "react";
import {
  mapContestToArenaEvent,
  mergeArenaEvents,
} from "@/features/contests/arena/lib/map-api";
import type { ArenaEvent } from "@/features/contests/arena/lib/types";
import { contestListItems } from "@/features/ctf-events/contest-list-items";
import { contestsApi } from "@/features/contests/contests-api";

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
        return { slug: event.slug, total: event.operatorCount };
      }
    }),
  );
  const bySlug = new Map(totals.map((t) => [t.slug, t.total]));
  return events.map((e) =>
    bySlug.has(e.slug) ? { ...e, operatorCount: bySlug.get(e.slug)! } : e,
  );
}

export function useCtfContests() {
  const [events, setEvents] = useState<ArenaEvent[] | null>(null);
  const [apiFailed, setApiFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const applyList = (merged: ArenaEvent[]) => {
      if (cancelled) {
        return;
      }
      setEvents(sortArenaEvents(merged));
      void enrichLiveOperatorCounts(merged).then((enriched) => {
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
        applyList(mergeArenaEvents(contests));
      })
      .catch(() => {
        if (!cancelled) {
          setApiFailed(true);
          applyList(mergeArenaEvents([]));
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
    error: apiFailed && events !== null && events.length === 0,
  };
}
