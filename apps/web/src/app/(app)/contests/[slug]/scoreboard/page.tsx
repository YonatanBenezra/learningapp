import { ContestScoreboardView } from "@/features/contests/components/contest-detail-view";
import { ScoreboardSkeleton } from "@/features/contests/scoreboard/scoreboard-skeleton";
import { Suspense } from "react";

export default async function ContestScoreboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="flex min-h-0 w-full max-w-none flex-1 flex-col bg-[#0F1520]">
      <Suspense fallback={<ScoreboardSkeleton />}>
        <ContestScoreboardView slug={slug} />
      </Suspense>
    </div>
  );
}
