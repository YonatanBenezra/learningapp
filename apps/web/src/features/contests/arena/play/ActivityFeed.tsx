"use client";

import { Flag } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ActivityRow } from "@/features/contests/arena/lib/play-types";
import { cn } from "@/lib/utils";

export function ActivityFeed({
  items,
  embedded,
}: {
  items: ActivityRow[];
  embedded?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <section
      className={cn(
        "overflow-hidden bg-[#151C2B]",
        !embedded && "rounded-sm border border-[#232C3D]",
      )}
    >
      {embedded ? null : (
        <div className="flex h-12 items-center justify-between gap-2 px-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7891]">
            Activity
          </h2>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#6B7891]">
            Live
          </span>
        </div>
      )}
      <ul
        className={cn(
          "play-activity-scroll overflow-y-auto",
          embedded ? "max-h-none flex-1" : "max-h-[420px]",
        )}
      >
        {items.length === 0 ? (
          <li className="border-t border-[#232C3D] px-5 py-8 text-center text-sm text-[#6B7891]">
            No recent captures on the board yet.
          </li>
        ) : null}
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex h-14 items-center gap-3 border-t border-[#232C3D] px-5",
              item.isYou && "bg-[#9FEF00]/[0.03]",
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1C2537] text-[#6B7891]">
              <Flag className="size-3" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-[#A4B1CD]">
                <span className={cn("font-medium", item.isYou && "text-[#9FEF00]")}>
                  {item.user}
                </span>{" "}
                <span className="text-[#6B7891]">
                  {item.kind === "firstBlood" ? "first blood" : "captured"}
                </span>
              </p>
              <p className="truncate text-xs text-[#6B7891]">{item.challenge}</p>
            </div>
            <div className="shrink-0 text-right">
              {item.points != null ? (
                <p className="font-mono text-xs tabular-nums text-[#A4B1CD]">+{item.points}</p>
              ) : null}
              <p className="text-[11px] text-[#6B7891]">{item.ago}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
