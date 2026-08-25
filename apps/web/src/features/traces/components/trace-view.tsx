type TraceViewProps = {
  runId: string;
};

export function TraceView({ runId }: TraceViewProps) {
  return (
    <section className="p-4">
      <h2 className="font-medium">Trace</h2>
      <p className="mt-2 text-sm opacity-70">{runId}</p>
    </section>
  );
}
