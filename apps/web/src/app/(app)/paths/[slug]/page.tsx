import { PathDetailView } from "@/features/paths/components/path-detail";

export default async function PathPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="lp-page lp-page-catalogue">
      <PathDetailView slug={slug} />
    </div>
  );
}
