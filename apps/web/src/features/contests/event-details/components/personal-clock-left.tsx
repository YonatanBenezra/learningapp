"use client";

import { useEffect, useState } from "react";
import { countdownParts, pad2 } from "@/features/contests/contest-countdown-parts";

export function PersonalClockLeft({ ms }: { ms: number | null }) {
  const [left, setLeft] = useState(ms);

  useEffect(() => {
    setLeft(ms);
    if (ms == null || ms <= 0) {
      return;
    }
    const id = window.setInterval(() => {
      setLeft((prev) => (prev == null ? null : Math.max(0, prev - 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [ms]);

  if (left == null) {
    return (
      <p className="mt-1 font-[family-name:var(--font-jetbrains-mono)] text-sm font-semibold text-white">
        —
      </p>
    );
  }

  const { hours, minutes } = countdownParts(left);
  const label = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${pad2(countdownParts(left).seconds)}s`;

  return (
    <p className="mt-1 font-[family-name:var(--font-jetbrains-mono)] text-sm font-semibold text-white">
      {label}
    </p>
  );
}
