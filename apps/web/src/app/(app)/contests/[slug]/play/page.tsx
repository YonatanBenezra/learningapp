import { ContestPlayView } from "@/features/contests/components/contest-detail-view";

export default async function ContestPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="flex min-h-0 w-full max-w-none flex-1 flex-col">
      <ContestPlayView slug={slug} />
    </div>
  );
}
