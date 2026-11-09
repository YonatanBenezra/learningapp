"use client";

import { LayoutGrid } from "lucide-react";
import { useState } from "react";
import { ARENA_CATEGORIES, type ArenaCategoryId } from "@/features/contests/arena/lib/categories";
import { cn } from "@/lib/utils";
import "./play-category-sidebar.css";

const VISIBLE_DEFAULT = 9;

function parseRatio(count: string): { solved: number; total: number } {
  const [a, b] = count.split("/").map((n) => parseInt(n, 10));
  return { solved: Number.isFinite(a) ? a! : 0, total: Number.isFinite(b) ? b! : 0 };
}

function CategoryRow({
  id,
  label,
  count,
  active,
  onSelect,
}: {
  id: ArenaCategoryId | "all";
  label: string;
  count: string;
  active: boolean;
  onSelect: () => void;
}) {
  const meta = id === "all" ? null : ARENA_CATEGORIES[id];
  const Icon = meta?.Icon ?? LayoutGrid;
  const { solved, total } = parseRatio(count);
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const complete = total > 0 && solved >= total;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "play-category-row",
          active && "is-active",
          complete && "play-category-row--complete",
        )}
        aria-current={active ? "true" : undefined}
      >
        <span className="play-category-row__tile">
          <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="play-category-row__body">
          <span className="play-category-row__label">{label}</span>
          <span className="play-category-row__track" aria-hidden>
            <span className="play-category-row__fill" style={{ width: `${pct}%` }} />
          </span>
        </span>
        {pct > 0 ? (
          <span className="play-category-row__edge" aria-hidden style={{ opacity: active || complete ? 1 : 0.35 }} />
        ) : null}
      </button>
    </li>
  );
}

export function CategorySidebar({
  activeCategory,
  categoryCounts,
  onCategoryChange,
  className,
}: {
  activeCategory: ArenaCategoryId | "all";
  categoryCounts: Record<ArenaCategoryId | "all", string>;
  onCategoryChange: (id: ArenaCategoryId | "all") => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const categories: { id: ArenaCategoryId | "all"; label: string }[] = [
    { id: "all", label: "All scenarios" },
    ...Object.values(ARENA_CATEGORIES).map((c) => ({ id: c.id, label: c.name })),
  ];
  const visible = expanded ? categories : categories.slice(0, VISIBLE_DEFAULT);
  const canExpand = categories.length > VISIBLE_DEFAULT;

  return (
    <nav
      className={cn("play-category-sidebar", className)}
      aria-label="Challenge categories"
    >
      <ul className="play-category-sidebar__list">
        {visible.map((cat) => (
          <CategoryRow
            key={cat.id}
            id={cat.id}
            label={cat.label}
            count={categoryCounts[cat.id]}
            active={activeCategory === cat.id}
            onSelect={() => onCategoryChange(cat.id)}
          />
        ))}
      </ul>
      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="play-category-sidebar__more"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </nav>
  );
}
