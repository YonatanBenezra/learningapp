"use client";

import { useEffect, useState } from "react";
import { countdownParts, pad2 } from "@/features/contests/contest-countdown-parts";

export function EventCountdown({ endsAt, ended }: { endsAt: string; ended: boolean }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (ended) {
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [ended]);

  if (ended) {
    return (
      <p className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[#6B7891]">
        Ended
      </p>
    );
  }

  const ms = Math.max(0, new Date(endsAt).getTime() - now);
  const { days, hours, minutes, seconds } = countdownParts(ms);
  const label =
    days > 0
      ? `${days}d ${hours}h ${minutes}m`
      : hours > 0
        ? `${hours}h ${minutes}m ${pad2(seconds)}s`
        : `${minutes}m ${pad2(seconds)}s`;

  return (
    <p className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[#9FEF00]">
      {label}
    </p>
  );
}
