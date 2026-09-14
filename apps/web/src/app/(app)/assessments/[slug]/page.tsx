import { AssessmentDetailView } from "@/features/assessments/components/assessment-detail-view";

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="lp-page lp-page-catalogue lp-page-contests">
      <AssessmentDetailView slug={slug} />
    </div>
  );
}
