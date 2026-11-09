"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { routes } from "@/config/routes";
import type { EventDetailsData, EventTabId } from "@/features/contests/event-details/types";
import { cn } from "@/lib/utils";

const TABS: {
  id: EventTabId;
  label: string;
  countKey?: keyof Pick<EventDetailsData, "challengeCount" | "updatesCount">;
  externalHref?: (slug: string) => string;
}[] = [
  { id: "overview", label: "Overview" },
  { id: "rules", label: "Rules" },
  { id: "challenges", label: "Challenges", countKey: "challengeCount", externalHref: routes.contestPlay },
  { id: "scoreboard", label: "Scoreboard", externalHref: routes.contestScoreboard },
  { id: "updates", label: "Updates", countKey: "updatesCount" },
];

export function EventTabs({
  event,
  active,
  onTabChange,
}: {
  event: EventDetailsData;
  active: EventTabId;
  onTabChange: (tab: EventTabId) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setTab = useCallback(
    (tab: EventTabId) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("tab", tab);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      onTabChange(tab);
    },
    [onTabChange, pathname, router, searchParams],
  );

  return (
    <nav className="mt-10 flex gap-7 overflow-x-auto border-b border-[#232C3D] pb-px" aria-label="Event sections">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const count =
          tab.countKey != null ? event[tab.countKey] : undefined;
        const external = tab.externalHref?.(event.slug);

        if (external && (tab.id === "challenges" || tab.id === "scoreboard")) {
          return (
            <Link
              key={tab.id}
              href={external}
              className="relative shrink-0 pb-3 text-sm font-semibold text-[#6B7891] transition-colors duration-150 hover:text-white"
            >
              {tab.label}
              {count != null && count > 0 ? (
                <span className="ml-1.5 rounded-full bg-[#232C3D] px-1.5 py-0.5 text-[11px] font-semibold text-[#A4B1CD]">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              "relative shrink-0 pb-3 text-sm font-semibold transition-colors duration-150",
              isActive ? "text-white" : "text-[#6B7891] hover:text-[#A4B1CD]",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
            {count != null && count > 0 ? (
              <span className="ml-1.5 rounded-full bg-[#232C3D] px-1.5 py-0.5 text-[11px] font-semibold text-[#A4B1CD]">
                {count}
              </span>
            ) : null}
            {isActive ? (
              <span
                className="absolute inset-x-0 -bottom-px h-0.5 bg-[#9FEF00]"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export function tabFromSearchParams(params: URLSearchParams): EventTabId {
  const raw = params.get("tab");
  if (raw === "rules" || raw === "updates") {
    return raw;
  }
  return "overview";
}
