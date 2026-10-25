"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { contestsApi } from "@/features/contests/contests-api";
import { mergeArenaEvents } from "@/lib/arena/map-api";
import { MOCK_OPERATORS } from "@/lib/arena/mock";
import type { ArenaEvent, ArenaOperator, ArenaTab } from "@/lib/arena/types";
import { ArenaHero } from "./ArenaHero";
import { EventCard } from "./EventCard";
import { EventTabs } from "./EventTabs";
import { LiveFeedTerminal } from "./LiveFeedTerminal";
import { TopOperators } from "./TopOperators";

function filterEvents(events: ArenaEvent[], tab: ArenaTab, query: string) {
  let list = events;
  if (tab === "my") {
    list = list.filter((e) => e.myResult);
  } else {
    list = list.filter((e) => e.status === tab);
  }
  const q = query.trim().toLowerCase();
  if (!q) {
    return list;
  }
  return list.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.slug.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q),
  );
}

export function ArenaHub() {
  const reduce = useReducedMotion();
  const [events, setEvents] = useState<ArenaEvent[] | null>(null);
  const [operators, setOperators] = useState<ArenaOperator[]>(MOCK_OPERATORS);
  const [tab, setTab] = useState<ArenaTab>("live");
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    contestsApi
      .list()
      .then(async (result) => {
        if (cancelled) {
          return;
        }
        const merged = mergeArenaEvents(result.items);
        setEvents(merged);
        const live = merged.find((e) => e.status === "live");
        if (live) {
          try {
            const board = await contestsApi.leaderboard(live.slug, 1, 10);
            if (!cancelled && board.items.length > 0) {
              setOperators(
                board.items.slice(0, 3).map((row, i) => ({
                  rank: row.rank,
                  name: row.displayName,
                  score: row.totalScore,
                  initials: row.displayName.slice(0, 2).toUpperCase(),
                  medal: (["gold", "silver", "bronze"] as const)[i] ?? "bronze",
                })),
              );
              setEvents((prev) =>
                (prev ?? merged).map((e) =>
                  e.slug === live.slug
                    ? {
                        ...e,
                        operatorCount: board.total,
                      }
                    : e,
                ),
              );
            }
          } catch {
            /* keep mock operators */
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setEvents(mergeArenaEvents([]));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = useMemo(
    () => events?.find((e) => e.status === "live") ?? events?.[0] ?? null,
    [events],
  );

  const counts = useMemo(() => {
    const base = { live: 0, upcoming: 0, archived: 0, my: 0 };
    if (!events) {
      return base;
    }
    for (const e of events) {
      if (e.status === "live") {
        base.live += 1;
      }
      if (e.status === "upcoming") {
        base.upcoming += 1;
      }
      if (e.status === "archived") {
        base.archived += 1;
      }
      if (e.myResult) {
        base.my += 1;
      }
    }
    return base;
  }, [events]);

  const grid = useMemo(
    () => (events ? filterEvents(events, tab, query) : []),
    [events, query, tab],
  );

  const heroStats = useMemo(() => {
    const live = featured;
    return {
      operators: live?.operatorCount ?? 0,
      flagsCaptured: 1284,
      firstBloods: live ? `15/${live.challengeCount}` : "—",
      clockMinutes: live?.clockMinutes ?? 180,
    };
  }, [featured]);

  if (!events) {
    return (
      <div className="arena-hub py-10" aria-busy="true" />
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="arena-hub py-10 text-[var(--arena-text-2)]">
        Could not load contests. Check the API and refresh.
      </div>
    );
  }

  return (
    <div className="arena-hub relative flex flex-col gap-6 pb-16 pt-6 sm:gap-7 sm:pb-20 sm:pt-8">
      <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start">
        {featured ? (
          <ArenaHero event={featured} stats={heroStats} />
        ) : null}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.08 }}
          className="flex w-full min-w-0 flex-col gap-4 md:grid md:grid-cols-2 md:gap-4 lg:flex lg:w-[min(400px,100%)] lg:shrink-0 lg:flex-col"
        >
          <LiveFeedTerminal live={featured?.status === "live"} />
          <TopOperators operators={operators} eventSlug={featured?.slug} />
        </motion.div>
      </div>
      <EventTabs tab={tab} counts={counts} query={query} onTab={setTab} onQuery={setQuery} />
      {grid.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--arena-text-2)]">No events in this filter.</p>
      ) : (
        <section
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          aria-label="Events"
        >
          {grid.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </section>
      )}
    </div>
  );
}
