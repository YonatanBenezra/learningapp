import { Award, Droplet, Flag, Timer, Users } from "lucide-react";
import type { EventStatCell } from "@/features/contests/event-details/types";

const ICONS = {
  flag: Flag,
  timer: Timer,
  award: Award,
  users: Users,
  droplet: Droplet,
} as const;

export function EventStatsStrip({ cells }: { cells: EventStatCell[] }) {
  return (
      <section
        className="mt-7 grid grid-cols-2 divide-y divide-[#232C3D] overflow-hidden rounded-[10px] border border-[#232C3D] bg-[#151C2B] sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-y-0"
        aria-label="Event statistics"
      >
        {cells.map((cell, i) => {
          const Icon = ICONS[cell.icon];
          const spanLast = i === cells.length - 1;
          return (
            <div
              key={cell.id}
              className={`flex gap-3.5 p-[18px_22px] ${spanLast ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""}`}
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: cell.iconBg, color: cell.iconColor }}
              >
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7891]">
                  {cell.label}
                </p>
                <p className="mt-1 font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-white">
                  {cell.value}
                  {cell.suffix ? (
                    <span className="ml-1 text-xs font-normal text-[#6B7891]">
                      · {cell.suffix}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          );
        })}
      </section>
  );
}
