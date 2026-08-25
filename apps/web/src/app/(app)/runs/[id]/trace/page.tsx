import { TraceView } from "@/features/traces/components/trace-view";

export default async function TracePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Trace</h1>
      <TraceView runId={id} />
    </main>
  );
}
