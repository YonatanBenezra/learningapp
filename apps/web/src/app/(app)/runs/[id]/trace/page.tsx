import { TraceView } from "@/features/traces/components/trace-view";

export default async function TracePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TraceView runId={id} />;
}
