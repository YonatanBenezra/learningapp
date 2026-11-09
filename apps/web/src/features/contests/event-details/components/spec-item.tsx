import type { EventSpec } from "@/features/contests/event-details/types";

export function SpecItem({ row }: { row: EventSpec }) {
  return (
    <div className="bg-[#151C2B] px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase text-[#6B7891]">{row.label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{row.value}</p>
    </div>
  );
}
