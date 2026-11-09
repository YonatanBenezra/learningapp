import { Suspense } from "react";
import { ContestPlayView } from "@/features/contests/components/contest-detail-view";
import { PlaySkeleton } from "@/features/contests/arena/play/PlaySkeleton";
export default async function ContestArenaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="flex min-h-0 w-full max-w-none flex-1 flex-col bg-[#0F1520]">
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col bg-[#0F1520]">
            <PlaySkeleton />
          </div>
        }
      >
        <ContestPlayView slug={slug} />
      </Suspense>
    </div>
  );
}
