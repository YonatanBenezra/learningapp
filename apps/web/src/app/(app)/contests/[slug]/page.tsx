import { ContestLobbyView } from "@/features/contests/components/contest-detail-view";

export default async function ContestLobbyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="flex min-h-0 w-full max-w-none flex-1 flex-col">
      <ContestLobbyView slug={slug} />
    </div>
  );
}
