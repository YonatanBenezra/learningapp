"use client";

import { MOCK_FEED } from "@/lib/arena/mock";

export function ActivityFeed() {
  const items = MOCK_FEED.slice(0, 5);
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)]">
      <div className="border-b border-[var(--arena-line)] px-4 py-3">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
          Activity
        </h2>
      </div>
      <ul className="max-h-[220px] overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.id}
            className="border-t border-[var(--arena-line)] px-4 py-2.5 font-mono text-[11px] leading-snug"
          >
            <span className="font-semibold text-[var(--arena-cyan)]">{item.user}</span>{" "}
            <span
              className={
                item.verb === "captured"
                  ? "text-[var(--arena-lime-fg)]"
                  : "text-[var(--arena-text-3)]"
              }
            >
              {item.verb}
            </span>{" "}
            <span className="text-[var(--arena-text-2)]">{item.challenge}</span>
            {item.points != null ? (
              <span className="float-right font-bold text-[var(--arena-lime-fg)]">
                +{item.points}
              </span>
            ) : null}
            <span className="mt-0.5 block text-[10px] text-[var(--arena-text-3)]">
              {item.time}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
