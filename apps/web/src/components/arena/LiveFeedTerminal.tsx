"use client";

import { Droplet } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { EXTRA_FEED, MOCK_FEED } from "@/lib/arena/mock";
import type { FeedItem } from "@/lib/arena/types";
import { Tag } from "./Tag";

function verbClass(verb: FeedItem["verb"]) {
  if (verb === "captured") {
    return "text-[var(--arena-lime-fg)]";
  }
  if (verb === "failed") {
    return "text-[var(--arena-text-3)]";
  }
  return "text-[var(--arena-cyan)]";
}

function FeedLine({ item }: { item: FeedItem }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-[7px] gap-y-1 font-mono text-[11.5px] leading-snug">
      <span className="text-[11px] text-[var(--arena-text-3)]">{item.time}</span>
      <span className="font-semibold text-[var(--arena-cyan)]">{item.user}</span>
      <span className={verbClass(item.verb)}>{item.verb}</span>
      <span className="text-[var(--arena-text-2)]">{item.challenge}</span>
      <span className="flex-1" />
      {item.firstBlood ? (
        <Droplet className="size-3 text-[var(--arena-red)]" aria-label="First blood" />
      ) : null}
      {item.points != null ? (
        <span className="font-bold text-[var(--arena-lime-fg)]">+{item.points}</span>
      ) : null}
    </div>
  );
}

export function LiveFeedTerminal({ live }: { live: boolean }) {
  const reduce = useReducedMotion();
  const [lines, setLines] = useState<FeedItem[]>(() => MOCK_FEED.slice(0, 6));
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => setCursorOn((v) => !v), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (reduce) {
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      const next = EXTRA_FEED[i % EXTRA_FEED.length];
      i += 1;
      setLines((prev) => [{ ...next, id: `${next.id}-${Date.now()}` }, ...prev].slice(0, 6));
    }, 4000);
    return () => window.clearInterval(id);
  }, [reduce]);

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
        <AnimatePresence initial={false}>
          {lines.map((item) => (
            <motion.div
              key={item.id}
              initial={reduce ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
            >
              <FeedLine item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
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
