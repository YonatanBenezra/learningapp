import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { BannerCard } from "@/features/contests/event-details/components/banner-card";
import { DateStrip } from "@/features/contests/event-details/components/date-strip";
import { EventHeroActions } from "@/features/contests/event-details/components/event-hero-actions";
import { DifficultyBadge, StatusBadge } from "@/features/contests/event-details/components/status-badge";
import type { EventDetailsData } from "@/features/contests/event-details/types";

export function EventHeroSection({ event }: { event: EventDetailsData }) {
  const headTitle = event.heroTitle;
  const cardTitle = event.heroTitle;

  return (
    <section className="relative overflow-hidden border-b border-[#1A2232]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -right-[10%] top-[-20%] size-[420px] rounded-full bg-[#9FEF00]/[0.28] blur-[90px]" />
        <div className="absolute -left-[8%] top-[-15%] size-[360px] rounded-full bg-[#8A94A8]/[0.18] blur-[90px]" />
        <div className="absolute bottom-[-20%] right-[5%] size-[320px] rounded-full bg-[#2EE6A6]/[0.12] blur-[90px]" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse 80% 70% at 70% 40%, #000 20%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 70% 40%, #000 20%, transparent 72%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-6 pb-12 pt-10">
        <Link
          href={routes.contestHub}
          className="mb-7 inline-flex items-center gap-2 text-[13px] text-[#6B7891] transition-colors duration-150 hover:text-[#9FEF00]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Events
        </Link>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_520px] lg:gap-12">
          <div className="order-2 lg:order-1">
            <div className="flex flex-wrap gap-2">
              {event.badges.map((b) => (
                <StatusBadge key={b} kind={b} />
              ))}
              {event.difficultyLabel ? (
                <DifficultyBadge label={event.difficultyLabel} />
              ) : null}
            </div>
            <h1 className="mt-5 text-[32px] font-bold tracking-tight text-white sm:text-[44px] sm:leading-[1.1]">
              {headTitle}
              {event.subtitle.trim() ? (
                <span className="font-medium text-[#6B7891]"> — {event.subtitle}</span>
              ) : null}
            </h1>
            <p className="mt-4 max-w-[560px] text-base leading-relaxed text-[#A4B1CD]">
              {event.leadParagraph}
            </p>
            <div className="mt-7">
              <DateStrip
                startAt={event.startAt}
                endAt={event.endAt}
                closesAt={event.closesAt}
                window={event.window}
              />
            </div>
            <EventHeroActions event={event} />
          </div>

          <div className="order-1 lg:order-2">
            <BannerCard title={cardTitle} variant="banner" />
          </div>
        </div>
      </div>
    </section>
  );
}
