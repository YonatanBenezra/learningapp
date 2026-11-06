import type { Metadata } from "next";
import { Suspense } from "react";
import { RankingPlatformView } from "@/features/ranking/ranking-platform-view";

export const metadata: Metadata = {
  title: "Ranking",
};

export default function DashboardRankingPage() {
  return (
    <Suspense fallback={null}>
      <RankingPlatformView />
    </Suspense>
  );
}
