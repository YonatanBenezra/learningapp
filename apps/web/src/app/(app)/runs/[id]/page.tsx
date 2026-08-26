import { RunDetail } from "@/features/workspace/components/run-detail";

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Run</h1>
      <RunDetail runId={id} />
    </main>
  );
}
