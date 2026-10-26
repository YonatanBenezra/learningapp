"use client";

import { Activity, Droplet, Flag } from "lucide-react";
import { Tag } from "@/components/arena/Tag";
import type { ActivityRow } from "@/lib/arena/play-types";

export function ActivityFeed({ items }: { items: ActivityRow[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--arena-line)] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Activity className="size-3.5 text-[var(--arena-lime-fg)]" aria-hidden />
          <h2 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
            Activity
          </h2>
        </div>
        <Tag tone="live" dot className="!py-0.5 !text-[9px]">
          Live
        </Tag>
      </div>
      <ul className="max-h-[280px] overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex gap-2.5 border-t border-[var(--arena-line)] px-4 py-2.5 ${
              item.isYou ? "bg-[color-mix(in_srgb,var(--arena-lime)_5%,transparent)]" : ""
            }`}
          >
            <span
              className={`flex size-[26px] shrink-0 items-center justify-center rounded-full ${
                item.kind === "firstBlood"
                  ? "bg-[color-mix(in_srgb,var(--arena-red)_14%,transparent)]"
                  : "bg-[color-mix(in_srgb,var(--arena-lime)_14%,transparent)]"
              }`}
            >
              {item.kind === "firstBlood" ? (
                <Droplet className="size-3 text-[var(--arena-red)]" aria-hidden />
              ) : (
                <Flag className="size-3 text-[var(--arena-lime-fg)]" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[12.5px] leading-snug">
                <span
                  className={
                    item.isYou ? "font-semibold text-[var(--arena-lime-fg)]" : "font-semibold text-[var(--arena-cyan)]"
                  }
                >
                  {item.user}
                </span>{" "}
                <span
                  className={
                    item.kind === "firstBlood" ? "text-[var(--arena-red)]" : "text-[var(--arena-text-3)]"
                  }
                >
                  {item.kind === "firstBlood" ? "first blood" : "captured"}
                </span>
              </p>
              <p className="font-mono text-xs text-[var(--arena-text-2)]">{item.challenge}</p>
            </div>
            <div className="shrink-0 text-right">
              {item.points != null ? (
                <p className="font-mono text-xs font-bold text-[var(--arena-lime-fg)]">+{item.points}</p>
              ) : null}
              <p className="font-mono text-[10.5px] text-[var(--arena-text-3)]">{item.ago}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
