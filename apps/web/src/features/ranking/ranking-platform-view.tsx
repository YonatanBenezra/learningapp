"use client";

import { useEffect } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { LeaderboardFigmaView } from "@/features/leaderboard/components/leaderboard-figma-view";
import "@/features/leaderboard/leaderboard-figma.css";

export function RankingPlatformView() {
  const { user, resolved } = useAuthSession();

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  if (!resolved || !user) {
    return <GlobalLoader platform fullPage label="Loading ranking…" />;
  }

  return (
    <main className="lp-dash-figma-main lp-page-leaderboard lp-page-leaderboard--htb !gap-0 !pb-16 !pt-6">
      <LeaderboardFigmaView />
    </main>
  );
}
