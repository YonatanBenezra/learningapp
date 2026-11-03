"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CtfNavbar } from "@/features/ctf-events/components/ctf-navbar";
import { EventGrid } from "@/features/ctf-events/components/event-grid";
import { EventSearch } from "@/features/ctf-events/components/event-search";
import { EventTabs } from "@/features/ctf-events/components/event-tabs";
import { filterArenaEvents } from "@/features/ctf-events/filter-events";
import { mapArenaToCtfEvent } from "@/features/ctf-events/map-arena-to-ctf";
import { ctfTabCounts } from "@/features/ctf-events/tab-counts";
import { useCtfContests } from "@/features/ctf-events/use-ctf-contests";
import type { CtfEventTab } from "@/features/ctf-events/types";
import { GlobalLoader } from "@/components/ui/global-loader";

const TAB_IDS: CtfEventTab[] = ["live", "upcoming", "joined", "past"];

function parseTab(raw: string | null): CtfEventTab {
  if (raw && TAB_IDS.includes(raw as CtfEventTab)) {
    return raw as CtfEventTab;
  }
  return "live";
}

const SEARCH_PLACEHOLDER: Record<CtfEventTab, string> = {
  live: "Search live capture the flag events",
  upcoming: "Search upcoming capture the flag events",
  joined: "Search events you joined",
  past: "Search past capture the flag events",
};

export function CtfEventsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const [query, setQuery] = useState("");
  const { events: arenaEvents, apiFailed, error, loading } = useCtfContests();

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  const setTab = useCallback(
    (next: CtfEventTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`?${params.toString()}`, { scroll: false });
      setQuery("");
    },
    [router, searchParams],
  );

  const tabCounts = useMemo(
    () => (arenaEvents ? ctfTabCounts(arenaEvents) : null),
    [arenaEvents],
  );

  const events = useMemo(() => {
    if (!arenaEvents) {
      return [];
    }
    return filterArenaEvents(arenaEvents, tab, query).map(mapArenaToCtfEvent);
  }, [arenaEvents, query, tab]);

  return (
    <div className="min-h-screen bg-platform-page pt-[var(--height-platform-topbar)] text-sm tracking-[0.14px] text-platform-text">
      <CtfNavbar />
      <main className="mx-auto w-[var(--lp-catalog-content-width)] max-w-[1320px] px-0 pb-16 pt-6">
        <EventTabs tab={tab} counts={tabCounts ?? undefined} onTab={setTab} />
        {apiFailed && arenaEvents && arenaEvents.length > 0 ? (
          <p className="mt-4 rounded border border-platform-border bg-platform-card px-3 py-2 text-sm text-platform-muted">
            Could not reach the contest API — showing cached catalog events. Refresh when the API is back.
          </p>
        ) : null}
        <EventSearch
          value={query}
          onChange={setQuery}
          placeholder={SEARCH_PLACEHOLDER[tab]}
        />
        {loading ? (
          <div className="py-20">
            <GlobalLoader />
          </div>
        ) : error ? (
          <p className="py-16 text-center text-sm text-platform-muted">
            Could not load contests. Check the API and refresh.
          </p>
        ) : (
          <EventGrid events={events} />
        )}
      </main>
    </div>
  );
}
