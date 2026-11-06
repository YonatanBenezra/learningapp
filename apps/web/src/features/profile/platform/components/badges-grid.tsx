"use client";

import { CalendarDays, FlaskConical, GraduationCap } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProfileBadge } from "@/features/profile/platform/types";
import { cn } from "@/lib/utils";

export function BadgeCategoryIcon({
  category,
  className,
}: {
  category: ProfileBadge["category"];
  className?: string;
}) {
  const Icon =
    category === "labs" ? FlaskConical : category === "academy" ? GraduationCap : CalendarDays;
  return <Icon className={cn("size-6 shrink-0", className)} aria-hidden strokeWidth={2} />;
}

type BadgesGridProps = {
  badges: ProfileBadge[];
};

const FILTERS = ["All", "Labs", "Academy"] as const;

export function BadgesGrid({ badges }: BadgesGridProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return badges;
    const key = filter.toLowerCase() as ProfileBadge["category"];
    return badges.filter((b) => b.category === key);
  }, [badges, filter]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-150",
              filter === f
                ? "bg-platform-accent text-platform-accent-on"
                : "bg-platform-input text-platform-muted hover:text-platform-text",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-platform-muted">No badges in this category yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((badge) => (
            <article
              key={badge.id}
              className="rounded-lg border border-platform-border bg-platform-card p-5 transition-colors duration-150 hover:border-[#2a3548]"
            >
              <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-platform-input text-platform-accent">
                <BadgeCategoryIcon category={badge.category} className="size-6" />
              </div>
              <h3 className="font-semibold text-platform-text">{badge.name}</h3>
              {badge.earnedAt ? (
                <p className="mt-1 text-xs text-platform-muted">{badge.earnedAt}</p>
              ) : null}
              {badge.rarityPct != null ? (
                <p
                  className="mt-2 text-xs text-platform-muted"
                  style={{ fontFamily: "var(--font-roboto-mono)" }}
                >
                  {badge.rarityPct}% of users
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
