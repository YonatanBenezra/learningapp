/** Operation clock for HUD — always `HH:MM:SS`. */
export function formatOperationClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Operation elapsed — `2:20:48` (hours optional when zero). */
export function formatOperationElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function operationElapsedMs(
  startedAt: string | null,
  elapsedMs: number | null | undefined,
): number {
  if (typeof elapsedMs === "number" && elapsedMs >= 0) {
    return elapsedMs;
  }
  if (!startedAt) {
    return 0;
  }
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) {
    return 0;
  }
  return Math.max(0, Date.now() - start);
}
