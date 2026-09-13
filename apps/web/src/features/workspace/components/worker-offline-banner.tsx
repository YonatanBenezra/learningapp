/** Rich worker-offline hint for run detail and similar banners. */
export function WorkerOfflineBanner() {
  return (
    <>
      Still queued after 30s. The grading worker may be offline — from the{" "}
      <strong>repo root</strong> run <code>npm run dev</code> (api + worker + web) or{" "}
      <code>npm run dev:worker</code>.
    </>
  );
}
