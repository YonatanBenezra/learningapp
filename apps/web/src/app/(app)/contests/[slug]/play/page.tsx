import { Suspense } from "react";
import { ContestPlayView } from "@/features/contests/components/contest-detail-view";
import { PlaySkeleton } from "@/components/arena/play/PlaySkeleton";
import { ArenaPage } from "@/components/arena/ArenaPage";

export default async function ContestPlayPage({
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
            <PlaySkeleton />
          </ArenaPage>
        }
      >
        <ContestPlayView slug={slug} />
      </Suspense>
    </div>
  );
}
