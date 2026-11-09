"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { routes } from "@/config/routes";
import { CategoryChips } from "@/features/contests/event-details/components/category-chips";
import { EventDetailsSidebar } from "@/features/contests/event-details/components/event-details-sidebar";
import { EventHeroSection } from "@/features/contests/event-details/components/event-hero-section";
import { EventStatsStrip } from "@/features/contests/event-details/components/event-stats-strip";
import { EventTabs, tabFromSearchParams } from "@/features/contests/event-details/components/event-tabs";
import { MissionBriefingCard } from "@/features/contests/event-details/components/mission-briefing-card";
import { EventAbout } from "@/features/contests/event-details/components/event-about";
import type { EventDetailsData, EventTabId } from "@/features/contests/event-details/types";

type EventDetailsPageProps = {
  event: EventDetailsData;
};

function EventDetailsPageInner({ event }: EventDetailsPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<EventTabId>(() => tabFromSearchParams(searchParams));

  return (
    <div className="min-h-dvh bg-[#0F1520] text-white">
      <EventHeroSection event={event} />

      <div className="mx-auto max-w-[1200px] px-6">
        <EventStatsStrip cells={event.statsStrip} />
        <EventTabs event={event} active={tab} onTabChange={setTab} />

        {tab === "overview" ? (
          <motion.div
            className="mt-8 grid grid-cols-1 gap-10 pb-20 lg:grid-cols-[1fr_340px]"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: "easeOut" }}
          >
            <div>
              <EventAbout paragraphs={event.aboutParagraphs} />
              <section className="mt-8" aria-labelledby="categories-heading">
                <h2 id="categories-heading" className="text-lg font-semibold text-white">
                  Categories
                </h2>
                <CategoryChips
                  categories={event.categories}
                  onSelect={() => router.push(routes.contestPlay(event.slug))}
                />
              </section>
              <MissionBriefingCard rules={event.missionRules} />
            </div>
            <EventDetailsSidebar event={event} />
          </motion.div>
        ) : null}

        {tab === "rules" ? (
          <motion.div
            className="mt-8 pb-20"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MissionBriefingCard rules={event.missionRules} />
          </motion.div>
        ) : null}

        {tab === "updates" ? (
          <div className="mt-8 pb-20 text-sm text-[#6B7891]">No updates yet for this event.</div>
        ) : null}
      </div>
    </div>
  );
}

export function EventDetailsPage(props: EventDetailsPageProps) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#0F1520]" aria-busy />}>
      <EventDetailsPageInner {...props} />
    </Suspense>
  );
}
