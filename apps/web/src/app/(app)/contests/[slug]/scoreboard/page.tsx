import { Suspense } from "react";
import { ArenaPage } from "@/components/arena/ArenaPage";
import { ContestScoreboardView } from "@/features/contests/components/contest-detail-view";

export default async function ContestScoreboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="flex min-h-0 w-full max-w-none flex-1 flex-col">
      <Suspense
        fallback={
          <ArenaPage>
            <div className="arena-hub arena-scoreboard px-4 py-10" aria-busy="true" />
          </ArenaPage>
        }
      >
        <ContestScoreboardView slug={slug} />
      </Suspense>
    </div>
  );
}
