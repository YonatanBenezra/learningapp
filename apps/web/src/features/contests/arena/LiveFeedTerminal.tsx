"use client";

import { useEffect, useState } from "react";
import { Tag } from "./Tag";

export function LiveFeedTerminal({ live }: { live: boolean }) {
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => setCursorOn((v) => !v), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-terminal)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--arena-line)] px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex gap-1" aria-hidden>
            <span className="size-[9px] rounded-full bg-[#FF5F57]/80" />
            <span className="size-[9px] rounded-full bg-[#FEBC2E]/80" />
            <span className="size-[9px] rounded-full bg-[#28C840]/80" />
          </span>
          <span className="truncate font-mono text-[11.5px] text-[var(--arena-text-3)]">
            live_feed.log
          </span>
        </div>
        {live ? <Tag tone="live" dot>LIVE</Tag> : null}
      </div>
      <div className="flex flex-col gap-2 p-3.5">
        <p className="font-mono text-[11.5px] leading-relaxed text-[var(--arena-text-3)]">
          Live capture feed is not connected — use the arena activity rail during an
          operation.
        </p>
        <p className="font-mono text-[11.5px] text-[var(--arena-lime-fg)]">
          <span className="text-[var(--arena-text-3)]">$</span>{" "}
          <span
            className="inline-block h-[13px] w-[7px] bg-[var(--arena-lime-fg)] align-middle"
            style={{ opacity: cursorOn ? 1 : 0 }}
            aria-hidden
          />
        </p>
      </div>
    </div>
  );
}
