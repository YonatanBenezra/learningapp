"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";
import type { ActivityRow, AroundYouRow } from "@/features/contests/arena/lib/play-types";
import { cn } from "@/lib/utils";
import { ActivityFeed } from "./ActivityFeed";
import { AroundYou } from "./AroundYou";

type RailTab = "around" | "activity";

export function OperatorRailPanel({
  around,
  activity,
  contestSlug,
  className,
}: {
  around: AroundYouRow[];
  activity: ActivityRow[];
  contestSlug: string;
  className?: string;
}) {
  const [tab, setTab] = useState<RailTab>("activity");

  return (
    <aside
      className={cn(
        "flex h-[calc(100vh-110px)] max-h-[720px] flex-col overflow-hidden rounded-md bg-[#151C2B]",
        className,
      )}
    >
      <div className="flex h-14 shrink-0 items-stretch border-b border-[#232C3D] px-4">
        {(
          [
            { id: "activity" as const, label: "Global activity" },
            { id: "around" as const, label: "Around you" },
          ] as const
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center text-sm transition-colors",
                active ? "font-semibold text-white" : "text-[#A4B1CD] hover:text-white",
              )}
            >
              {t.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#9FEF00]" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab === "activity" ? (
          activity.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="relative flex size-12 items-center justify-center">
                <MessageSquare className="size-8 text-white/80" aria-hidden />
                <MessageSquare
                  className="absolute -bottom-0.5 -right-1 size-5 text-[#9FEF00]"
                  aria-hidden
                />
              </span>
              <p className="text-sm font-bold text-white">Game on</p>
              <p className="text-[13px] leading-relaxed text-[#A4B1CD]">
                Captures and first bloods from the board show up here as operators solve challenges.
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ActivityFeed items={activity} embedded />
            </div>
          )
        ) : around.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-sm text-[#6B7891]">
            Climb the board to see operators near your rank.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <AroundYou rows={around} contestSlug={contestSlug} embedded />
          </div>
        )}
      </div>
    </aside>
  );
}
