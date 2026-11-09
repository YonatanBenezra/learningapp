"use client";

import { Calendar } from "lucide-react";
import { formatEventDateTime } from "@/features/contests/event-details/format-event-datetime";
import { EventCountdown } from "@/features/contests/event-details/components/event-countdown";

type DateStripProps = {
  startAt: string;
  endAt: string;
  closesAt: string;
  window: "upcoming" | "open" | "closed";
};

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col px-4 py-3 sm:px-5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7891]">
        {label}
      </span>
      <div className="mt-1.5 whitespace-nowrap">{children}</div>
    </div>
  );
}

export function DateStrip({ startAt, endAt, closesAt, window }: DateStripProps) {
  return (
    <div className="inline-flex max-w-full flex-col overflow-hidden rounded-[10px] border border-[#232C3D] bg-[#151C2B]/80 sm:flex-row sm:divide-x sm:divide-[#232C3D]">
      <Cell label="Starts">
        <p
          className="flex items-center gap-2 text-sm font-semibold text-white"
          title="Based on your timezone"
        >
          <Calendar className="size-4 shrink-0 text-[#6B7891]" aria-hidden />
          {formatEventDateTime(startAt)}
        </p>
      </Cell>
      <Cell label="Ends">
        <p
          className="flex items-center gap-2 text-sm font-semibold text-white"
          title="Based on your timezone"
        >
          <Calendar className="size-4 shrink-0 text-[#6B7891]" aria-hidden />
          {formatEventDateTime(endAt)}
        </p>
      </Cell>
      <Cell label="Closes in">
        <EventCountdown endsAt={closesAt} ended={window === "closed"} />
      </Cell>
    </div>
  );
}
