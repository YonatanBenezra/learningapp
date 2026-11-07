"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { routes } from "@/config/routes";
import { EventAbout } from "@/features/contests/event-details/components/event-about";
import { EventDetailsFooter } from "@/features/contests/event-details/components/event-details-footer";
import { EventHeader } from "@/features/contests/event-details/components/event-header";
import { EventSidebar } from "@/features/contests/event-details/components/event-sidebar";
import { HeroBanner } from "@/features/contests/event-details/components/hero-banner";
import type { EventDetailsData } from "@/features/contests/event-details/types";

type EventDetailsPageProps = {
  event: EventDetailsData;
};

export function EventDetailsPage({ event }: EventDetailsPageProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="lp-dash-figma-main lp-ctf-event-detail !gap-8 min-h-0 flex-1 !pb-16 !pt-6 text-white antialiased"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.35, ease: "easeOut" }}
    >
        <Link
          href={routes.contestHub}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[#6B7891] transition-colors duration-150 hover:text-[#9FEF00]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Events
        </Link>

        <HeroBanner title={event.heroTitle} badges={event.badges} />
        <EventHeader event={event} />

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_310px] lg:gap-16">
          <EventAbout paragraphs={event.aboutParagraphs} />
          <EventSidebar event={event} />
        </div>

        <EventDetailsFooter />
    </motion.div>
  );
}
