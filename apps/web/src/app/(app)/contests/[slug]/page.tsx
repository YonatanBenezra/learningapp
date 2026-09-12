import { ContestDetailView } from "@/features/contests/components/contest-detail-view";

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="lp-page lp-page-catalogue lp-page-contests">
      <ContestDetailView slug={slug} />
    </div>
  );
}
