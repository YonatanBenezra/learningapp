import { ContestDetailView } from "@/features/contests/components/contest-detail-view";
import "@/features/contests/contests.css";

export default async function ContestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="lp-page lp-page-contests">
      <ContestDetailView slug={slug} />
    </div>
  );
}
