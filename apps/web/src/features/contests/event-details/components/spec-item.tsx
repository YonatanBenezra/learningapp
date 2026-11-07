import { Flag, Globe, MapPin, Swords, Users, type LucideIcon } from "lucide-react";
import type { EventSpecRow } from "@/features/contests/event-details/types";

const ICONS: Record<EventSpecRow["icon"], LucideIcon> = {
  flag: Flag,
  globe: Globe,
  "map-pin": MapPin,
  users: Users,
  swords: Swords,
};

export function SpecItem({ row }: { row: EventSpecRow }) {
  const Icon = ICONS[row.icon];
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <p className="text-[13px] text-[#6B7891]">{row.label}</p>
      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className="size-4 shrink-0 text-[#6B7891]" aria-hidden />
        {row.value}
      </p>
    </li>
  );
}
