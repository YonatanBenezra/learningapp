import { EmployerReportView } from "@/features/profile/components/public-profile";

export default async function EmployerReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EmployerReportView slug={slug} />;
}
