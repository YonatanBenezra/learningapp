"use client";

import { ARENA_CATEGORIES, type ArenaCategoryId } from "@/lib/arena/categories";
import { cn } from "@/lib/utils";

export type PlayFilterState = {
  category: ArenaCategoryId | "all";
  difficulties: Set<string>;
  status: Set<"unsolved" | "solved">;
};

const DIFF_COLORS: Record<string, string> = {
  Easy: "var(--arena-lime-fg)",
  Medium: "var(--arena-amber)",
  Hard: "var(--arena-red)",
  Insane: "var(--arena-purple)",
};

export function PlayFilters({
  state,
  onChange,
  categoryCounts,
}: {
  state: PlayFilterState;
  onChange: (next: PlayFilterState) => void;
  categoryCounts: Record<ArenaCategoryId | "all", string>;
}) {
  const categories: { id: ArenaCategoryId | "all"; label: string }[] = [
    { id: "all", label: "All challenges" },
    ...Object.values(ARENA_CATEGORIES).map((c) => ({ id: c.id, label: c.name })),
  ];

  const difficulties = ["Easy", "Medium", "Hard", "Insane"] as const;

  function toggleDifficulty(d: string) {
    const next = new Set(state.difficulties);
    if (next.has(d)) {
      next.delete(d);
    } else {
      next.add(d);
    }
    onChange({ ...state, difficulties: next });
  }

  function toggleStatus(s: "unsolved" | "solved") {
    const next = new Set(state.status);
    if (next.has(s)) {
      next.delete(s);
    } else {
      next.add(s);
    }
    onChange({ ...state, status: next });
  }

  return (
    <aside className="play-filters flex flex-col gap-5">
      <div>
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
          Category
        </h2>
        <ul className="mt-2 flex flex-col gap-0.5">
          {categories.map((cat) => {
            const meta = cat.id === "all" ? null : ARENA_CATEGORIES[cat.id];
            const active = state.category === cat.id;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  className={cn(
                    "filter-cat-btn flex w-full items-center gap-2 py-1.5 pl-2 pr-2 text-left text-[13px] transition-colors",
                    active
                      ? "is-active font-medium text-[var(--arena-ink)]"
                      : "text-[var(--arena-text-2)] hover:bg-[color-mix(in_srgb,var(--arena-ink)_4%,transparent)]",
                  )}
                  onClick={() => onChange({ ...state, category: cat.id })}
                >
                  {meta ? (
                    <meta.Icon className="size-3.5 shrink-0" style={{ color: meta.colorVar }} />
                  ) : (
                    <span className="size-3.5 shrink-0 rounded-sm bg-[var(--arena-line)]" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{cat.label}</span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--arena-text-3)]">
                    {categoryCounts[cat.id]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
          Difficulty
        </h2>
        <ul className="mt-2 space-y-1.5">
          {difficulties.map((d) => (
            <li key={d}>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[var(--arena-text-2)]">
                <input
                  type="checkbox"
                  checked={state.difficulties.size === 0 || state.difficulties.has(d)}
                  onChange={() => toggleDifficulty(d)}
                  className="size-3.5 rounded border-[var(--arena-line-2)] accent-[var(--arena-lime)]"
                />
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: DIFF_COLORS[d] }}
                  aria-hidden
                />
                {d}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
          Status
        </h2>
        <ul className="mt-2 space-y-1.5">
          {(["unsolved", "solved"] as const).map((s) => (
            <li key={s}>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[var(--arena-text-2)]">
                <input
                  type="checkbox"
                  checked={state.status.size === 0 || state.status.has(s)}
                  onChange={() => toggleStatus(s)}
                  className="size-3.5 rounded border-[var(--arena-line-2)] accent-[var(--arena-lime)]"
                />
                {s === "unsolved" ? "Unsolved" : "Solved"}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
