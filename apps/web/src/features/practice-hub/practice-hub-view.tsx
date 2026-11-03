"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { DashboardWorkspaceShell } from "@/features/dashboard/components/dashboard-workspace-shell";
import {
  filterPracticeProblems,
  practiceTabCounts,
} from "@/features/practice-hub/filter-problems";
import { ProblemGrid } from "@/features/practice-hub/components/problem-grid";
import { ProblemSearch } from "@/features/practice-hub/components/problem-search";
import { ProblemTabs } from "@/features/practice-hub/components/problem-tabs";
import { usePracticeProblems } from "@/features/practice-hub/use-practice-problems";
import type { PracticeTab } from "@/features/practice-hub/types";

const TAB_IDS: PracticeTab[] = ["all", "rag", "guardrails", "todo", "solved"];

function parseTab(raw: string | null): PracticeTab {
  if (raw && TAB_IDS.includes(raw as PracticeTab)) {
    return raw as PracticeTab;
  }
  return "all";
}

const SEARCH_PLACEHOLDER: Record<PracticeTab, string> = {
  all: "Search hands-on labs and challenges",
  rag: "Search RAG labs",
  guardrails: "Search guardrails labs",
  todo: "Search labs you have not cleared",
  solved: "Search labs you solved",
};

export function PracticeHubView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const [query, setQuery] = useState("");
  const { user: sessionUser } = useAuthSession();
  const { problems, error, loading } = usePracticeProblems();

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  const setTab = useCallback(
    (next: PracticeTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`?${params.toString()}`, { scroll: false });
      setQuery("");
    },
    [router, searchParams],
  );

  const tabCounts = useMemo(
    () => (problems ? practiceTabCounts(problems) : null),
    [problems],
  );

  const filtered = useMemo(() => {
    if (!problems) {
      return [];
    }
    return filterPracticeProblems(problems, tab, query);
  }, [problems, query, tab]);

  if (!sessionUser) {
    return <GlobalLoader platform />;
  }

  return (
    <DashboardWorkspaceShell user={sessionUser}>
      <main className="lp-dash-figma-main lp-practice-hub !gap-0 !pb-16 !pt-6">
        <ProblemTabs tab={tab} counts={tabCounts ?? undefined} onTab={setTab} />
        <ProblemSearch
          value={query}
          onChange={setQuery}
          placeholder={SEARCH_PLACEHOLDER[tab]}
        />
        {loading ? (
          <div className="py-20">
            <GlobalLoader platform contained label="Loading labs…" />
          </div>
        ) : error ? (
          <p className="py-16 text-center text-sm text-platform-muted">
            Could not load problems. Check the API and refresh.
          </p>
        ) : (
          <ProblemGrid problems={filtered} />
        )}
      </main>
    </DashboardWorkspaceShell>
  );
}
