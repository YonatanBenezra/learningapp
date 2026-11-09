"use client";

import { useEffect, useMemo, useState } from "react";
import { remainingMs } from "@/features/contests/contest-clock";
import { cn } from "@/lib/utils";

function formatCountdown(ms: number, compact: boolean) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const urgent = ms > 0 && ms < 3_600_000;

  if (compact) {
    return {
      urgent,
      text: `${days}d ${hours}h`,
    };
  }

  const bits: { v: number; u: string }[] = [];
  if (days > 0) {
    bits.push({ v: days, u: days === 1 ? "Day" : "Days" });
  }
  if (hours > 0 || days > 0) {
    bits.push({ v: hours, u: hours === 1 ? "Hour" : "Hours" });
  }
  bits.push({ v: minutes, u: minutes === 1 ? "Min" : "Mins" });

  return { urgent, bits };
}

export function CountdownPill({
  endsAt,
  ended,
  compact,
  className,
}: {
  endsAt: string | null;
  ended: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (ended || !endsAt) {
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [ended, endsAt]);

  const remain = useMemo(
    () => (endsAt ? remainingMs(endsAt, now) : 0),
    [endsAt, now],
  );

  if (ended) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-[#2A3446] px-5 py-2 text-[13px] text-[#6B7891]",
          className,
        )}
      >
        Event ended
      </span>
    );
  }

  const formatted = formatCountdown(remain, Boolean(compact));

  if (compact && "text" in formatted) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-[#2A3446] px-3 py-1.5 font-mono text-xs tabular-nums",
          formatted.urgent ? "text-[#FF5A5F]" : "text-[#A4B1CD]",
          className,
        )}
      >
        {formatted.text}
      </span>
    );
  }

  const bits = ("bits" in formatted ? formatted.bits : []) ?? [];

  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-wrap items-center rounded-full border border-[#2A3446] py-2 pl-5 pr-4 text-[13px] text-[#A4B1CD]",
        className,
      )}
    >
      <span className="shrink-0 text-[#6B7891]">Ends in</span>
      {bits.map((b, i) => (
        <span key={i} className="inline-flex items-center">
          <CountdownDivider />
          <span className="whitespace-nowrap px-3">
            <span
              className={cn(
                "font-mono text-[13px] font-bold tabular-nums",
                formatted.urgent ? "text-[#FF5A5F]" : "text-white",
              )}
            >
              {b.v}
            </span>{" "}
            <span className="text-[13px] text-[#A4B1CD]">{b.u}</span>
          </span>
        </span>
      ))}
    </span>
  );
}

function CountdownDivider() {
  return <span className="h-4 w-px shrink-0 bg-[#2A3446]" aria-hidden />;
}
