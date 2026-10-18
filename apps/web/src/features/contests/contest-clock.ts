"use client";

import { useEffect, useState } from "react";

export function remainingMs(deadlineIso: string, nowMs = Date.now()): number {
  const deadline = new Date(deadlineIso).getTime();
  if (Number.isNaN(deadline)) {
    return 0;
  }
  return Math.max(0, deadline - nowMs);
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`);
  }
  parts.push(`${minutes}m`);
  if (days === 0 && hours === 0) {
    parts.push(`${seconds}s`);
  }
  return parts.join(" ");
}

export function useDeadlineCountdown(deadlineIso: string | null): number | null {
  const [remaining, setRemaining] = useState<number | null>(() =>
    deadlineIso ? remainingMs(deadlineIso) : null,
  );

  useEffect(() => {
    if (!deadlineIso) {
      setRemaining(null);
      return;
    }
    const tick = () => setRemaining(remainingMs(deadlineIso));
    tick();
    const id = globalThis.setInterval(tick, 1000);
    return () => globalThis.clearInterval(id);
  }, [deadlineIso]);

  return remaining;
}
