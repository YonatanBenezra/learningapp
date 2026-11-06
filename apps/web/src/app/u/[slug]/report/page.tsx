import { PublicProfileReportPage } from "../public-profile-report-page";

export default async function PublicProfileReportPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicProfileReportPage slug={slug} />;
}
