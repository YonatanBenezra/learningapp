"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { EventGrid } from "@/features/ctf-events/components/event-grid";
import { EventSearch } from "@/features/ctf-events/components/event-search";
import { EventTabs } from "@/features/ctf-events/components/event-tabs";
import { filterArenaEvents } from "@/features/ctf-events/filter-events";
import { mapArenaToCtfEvent } from "@/features/ctf-events/map-arena-to-ctf";
import { ctfTabCounts } from "@/features/ctf-events/tab-counts";
import { useCtfContests } from "@/features/ctf-events/use-ctf-contests";
import type { CtfEventTab } from "@/features/ctf-events/types";

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
  const { user: sessionUser, resolved: sessionResolved } = useAuthSession();
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

  const bootstrapping = !sessionResolved || !sessionUser || loading;

  if (bootstrapping) {
    return <GlobalLoader platform fullPage label="Loading contests…" />;
  }

  return (
    <main className="lp-dash-figma-main lp-ctf-events !gap-0 !pb-16 !pt-6">
      <EventTabs tab={tab} counts={tabCounts ?? undefined} onTab={setTab} />
      {apiFailed ? (
        <p className="mt-4 rounded border border-platform-border bg-platform-card px-3 py-2 text-sm text-platform-muted">
          Could not reach the contest API. Refresh when the API is back.
        </p>
      ) : null}
      <EventSearch
        value={query}
        onChange={setQuery}
        placeholder={SEARCH_PLACEHOLDER[tab]}
      />
      {error ? (
        <p className="py-16 text-center text-sm text-platform-muted">
          Could not load contests. Check the API and refresh.
        </p>
      ) : (
        <EventGrid events={events} />
      )}
    </main>
  );
}
