"use client";

import { Lock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { ChallengeCard } from "@/components/arena/ChallengeCard";
import { ScoreboardPreview } from "@/components/arena/ScoreboardPreview";
import { Tag } from "@/components/arena/Tag";
import { routes } from "@/config/routes";
import { contestsApi } from "@/features/contests/contests-api";
import { mergeLeaderboardIntoLobby, mapContestToLobby } from "@/lib/arena/map-lobby";
import type { LobbyEvent } from "@/lib/arena/lobby-types";
import type { ContestDetail } from "@/types/contest";
import { LobbyBreadcrumb } from "./Breadcrumb";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { EventHeader } from "./EventHeader";
import { JoinCard } from "./JoinCard";
import { MissionBriefing } from "./MissionBriefing";
import { ScoringChart } from "./ScoringChart";

export function EventLobby({ initialContest }: { initialContest: ContestDetail }) {
  const reduce = useReducedMotion();
  const [event, setEvent] = useState<LobbyEvent>(() => mapContestToLobby(initialContest));

  const refreshBoard = useCallback(async () => {
    try {
      const board = await contestsApi.leaderboard(event.slug, 1, 8);
      setEvent((prev) => mergeLeaderboardIntoLobby(prev, board));
    } catch {
      /* keep seeded rows */
    }
  }, [event.slug]);

  useEffect(() => {
    void refreshBoard();
    const id = window.setInterval(() => void refreshBoard(), 60_000);
    return () => window.clearInterval(id);
  }, [refreshBoard]);

  return (
    <div className="arena-hub arena-lobby relative flex flex-col pb-24 pt-6 sm:pb-20 sm:pt-8">
      <LobbyBreadcrumb title={event.title} />
      <EventHeader event={event} />

      <div className="arena-lobby-columns flex flex-col lg:flex-row lg:items-start">
        <div className="arena-lobby-main order-2 flex min-w-0 flex-1 flex-col gap-5 lg:order-1">
          <MissionBriefing rules={event.rules} index={0} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ScoringChart index={1} />
            <CategoryBreakdown
              categories={event.categories}
              challengeCount={event.challengeCount}
              index={2}
            />
          </div>
          <motion.section
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.18 }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[var(--arena-ink)]">Challenges</h2>
              <Tag tone="solo" icon={<Lock className="size-[11px]" aria-hidden />}>
                LOCKED UNTIL YOU JOIN
              </Tag>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {event.challengePreviews.map((ch) => (
                <ChallengeCard
                  key={ch.id}
                  variant="locked"
                  title={ch.title}
                  categoryId={ch.categoryId}
                  difficulty={ch.difficulty}
                  basePoints={ch.basePoints}
                  solves={ch.solves}
                  firstBloodUser={ch.firstBloodUser}
                />
              ))}
            </div>
          </motion.section>
        </div>

        <aside className="arena-lobby-side order-1 flex w-full shrink-0 flex-col lg:order-2 lg:w-[400px] lg:sticky lg:top-[88px]">
          <JoinCard event={event} className="max-sm:hidden" index={0} />
          <ScoreboardPreview
            rows={event.scoreboard}
            scoreboardHref={routes.contestScoreboard(event.slug)}
            index={1}
          />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--arena-line)] bg-[color-mix(in_srgb,var(--arena-bg)_94%,transparent)] p-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        <div className="arena-hub !max-w-none !px-[var(--arena-hub-pad)]">
          <JoinCard event={event} compact />
        </div>
      </div>
    </div>
  );
}
