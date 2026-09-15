import { VerifyResultView } from "@/features/verify/components/verify-result-view";

export default async function VerifyResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;
  return <VerifyResultView resultId={resultId} />;
}
