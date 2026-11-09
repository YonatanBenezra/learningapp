"use client";

import { ARENA_CATEGORIES, type ArenaCategoryId } from "@/features/contests/arena/lib/categories";
import { cn } from "@/lib/utils";
import { FilterCheckbox } from "./FilterCheckbox";

export type PlayFilterState = {
  category: ArenaCategoryId | "all";
  difficulties: Set<string>;
  status: Set<"unsolved" | "solved">;
  query: string;
  sort: "points" | "solves" | "difficulty" | "newest";
};

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Insane"] as const;

export function defaultPlayFilters(): PlayFilterState {
  return {
    category: "all",
    difficulties: new Set(),
    status: new Set(),
    query: "",
    sort: "points",
  };
}

function CategoryItem({
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
  const Icon = meta?.Icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex h-10 w-full items-center gap-3 rounded-sm px-3 text-left transition-colors",
        active
          ? "bg-[#18202F] text-white"
          : "text-[#A4B1CD] hover:bg-[#151C2B]",
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-sm bg-[#9FEF00]" aria-hidden />
      ) : null}
      <span className="play-category-tile flex size-6 shrink-0 items-center justify-center rounded-sm">
        {Icon ? <Icon className="size-3.5" aria-hidden /> : <span className="size-2 rounded-sm bg-[#6B7891]" />}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
      <span
        className={cn(
          "font-mono text-xs tabular-nums",
          active ? "text-[#A4B1CD]" : "text-[#6B7891]",
        )}
      >
        {count}
      </span>
    </button>
  );
}

export function FilterSidebar({
  state,
  onChange,
  categoryCounts,
  className,
}: {
  state: PlayFilterState;
  onChange: (next: PlayFilterState) => void;
  categoryCounts: Record<ArenaCategoryId | "all", string>;
  className?: string;
}) {
  const categories: { id: ArenaCategoryId | "all"; label: string }[] = [
    { id: "all", label: "All challenges" },
    ...Object.values(ARENA_CATEGORIES).map((c) => ({ id: c.id, label: c.name })),
  ];

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

  function reset() {
    onChange(defaultPlayFilters());
  }

  const sectionTitle =
    "mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#6B7891]";

  return (
    <aside className={cn("play-filters flex flex-col", className)}>
      <FilterSection title="Categories" className="mb-6">
        <ul className="flex flex-col gap-0.5">
          {categories.map((cat) => (
            <li key={cat.id}>
              <CategoryItem
                id={cat.id}
                label={cat.label}
                count={categoryCounts[cat.id]}
                active={state.category === cat.id}
                onSelect={() => onChange({ ...state, category: cat.id })}
              />
            </li>
          ))}
        </ul>
      </FilterSection>

      <div className="mb-6">
        <h2 className={sectionTitle}>Difficulty</h2>
        <div className="flex flex-col gap-0.5">
          {DIFFICULTIES.map((d) => (
            <FilterCheckbox
              key={d}
              checked={state.difficulties.size === 0 || state.difficulties.has(d)}
              onChange={() => toggleDifficulty(d)}
              label={d}
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className={sectionTitle}>Status</h2>
        <div className="flex flex-col gap-0.5">
          <FilterCheckbox
            checked={state.status.size === 0 || state.status.has("unsolved")}
            onChange={() => toggleStatus("unsolved")}
            label="Unsolved"
          />
          <FilterCheckbox
            checked={state.status.size === 0 || state.status.has("solved")}
            onChange={() => toggleStatus("solved")}
            label="Solved"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={reset}
        className="mt-auto text-left text-sm text-[#6B7891] transition-colors hover:text-[#9FEF00]"
      >
        Reset filters
      </button>
    </aside>
  );
}

function FilterSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#6B7891]">
        {title}
      </h2>
      {children}
    </div>
  );
}

/** Horizontal category chips for narrow viewports */
export function MobileCategoryChips({
  state,
  onChange,
  categoryCounts,
}: {
  state: PlayFilterState;
  onChange: (next: PlayFilterState) => void;
  categoryCounts: Record<ArenaCategoryId | "all", string>;
}) {
  const categories: { id: ArenaCategoryId | "all"; label: string }[] = [
    { id: "all", label: "All" },
    ...Object.values(ARENA_CATEGORIES).map((c) => ({ id: c.id, label: c.name })),
  ];
  return (
    <div className="play-mobile-chips mb-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {categories.map((cat) => {
        const active = state.category === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange({ ...state, category: cat.id })}
            className={cn(
              "shrink-0 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-[#2F3A50] bg-[#18202F] text-white"
                : "border-[#232C3D] text-[#A4B1CD]",
            )}
          >
            {cat.label}{" "}
            <span className="font-mono text-[#6B7891]">{categoryCounts[cat.id]}</span>
          </button>
        );
      })}
    </div>
  );
}
