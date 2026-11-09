"use client";

import type { EventCategoryChip } from "@/features/contests/event-details/types";

type CategoryChipsProps = {
  categories: EventCategoryChip[];
  onSelect?: (id: EventCategoryChip["id"]) => void;
};

export function CategoryChips({ categories, onSelect }: CategoryChipsProps) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect?.(cat.id)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#232C3D] bg-[#151C2B] px-3 py-2 text-left transition-colors duration-150 hover:border-[#2A3446]"
        >
          <span
            className="size-2 shrink-0 rounded-sm"
            style={{ backgroundColor: cat.color }}
            aria-hidden
          />
          <span className="text-[13px] font-medium text-white">{cat.name}</span>
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-[#6B7891]">
            {cat.count}
          </span>
        </button>
      ))}
    </div>
  );
}
