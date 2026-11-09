"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { AvatarStack } from "@/features/contests/event-details/components/avatar-stack";
import { HexLogo } from "@/features/contests/event-details/components/hex-logo";
import { PersonalClockLeft } from "@/features/contests/event-details/components/personal-clock-left";
import type { EventDetailsData } from "@/features/contests/event-details/types";

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[10px] border border-[#232C3D] bg-[#151C2B] p-5 ${className}`}
    >
      {children}
    </section>
  );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3.5 text-[11px] font-semibold uppercase tracking-widest text-[#6B7891]">
      {children}
    </h3>
  );
}

export function EventDetailsSidebar({ event }: { event: EventDetailsData }) {
  const progress = event.userProgress;

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Event sidebar">
      {progress ? (
        <Panel>
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <PanelHeading>Your progress</PanelHeading>
            <Link
              href={routes.contestPlay(event.slug)}
              className="text-[13px] font-semibold text-[#9FEF00] hover:underline"
            >
              Open board →
            </Link>
          </div>
          <div className="flex items-end justify-between gap-3">
            <p className="font-[family-name:var(--font-jetbrains-mono)] text-[28px] font-semibold leading-none text-white">
              {progress.flagsSolved}
              <span className="text-base font-normal text-[#6B7891]">
                {" "}
                / {progress.flagsTotal} flags
              </span>
            </p>
            {progress.rank != null ? (
              <p className="font-[family-name:var(--font-jetbrains-mono)] text-sm font-semibold text-[#9FEF00]">
                #{progress.rank}
                {progress.rankDelta > 0 ? ` ▲${progress.rankDelta}` : ""}
              </p>
            ) : null}
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#232C3D]"
            role="progressbar"
            aria-valuenow={progress.flagsSolved}
            aria-valuemin={0}
            aria-valuemax={progress.flagsTotal}
          >
            <div
              className="h-full rounded-full bg-[#9FEF00] transition-[width] duration-300"
              style={{
                width: `${Math.min(100, (progress.flagsSolved / Math.max(1, progress.flagsTotal)) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-[#232C3D] pt-3.5 text-center">
            <div>
              <p className="text-[11px] uppercase text-[#6B7891]">Points</p>
              <p className="mt-1 font-[family-name:var(--font-jetbrains-mono)] text-sm font-semibold text-white">
                {progress.points.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-[#6B7891]">Clock left</p>
              <PersonalClockLeft ms={progress.clockLeftMs} />
            </div>
            <div>
              <p className="text-[11px] uppercase text-[#6B7891]">Bloods</p>
              <p className="mt-1 font-[family-name:var(--font-jetbrains-mono)] text-sm font-semibold text-white">
                {progress.firstBloods}
              </p>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeading>Hosted by</PanelHeading>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-md bg-[#1B2434]">
            <HexLogo size={26} />
          </span>
          <span className="text-sm font-semibold text-white">{event.host.name}</span>
        </div>
        <Link
          href={event.host.websiteUrl}
          className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[#9FEF00] hover:underline"
        >
          {event.host.websiteLabel}
          <ExternalLink className="size-3.5 opacity-80" aria-hidden />
        </Link>
      </Panel>

      <Panel>
        <PanelHeading>Going</PanelHeading>
        <div className="flex items-center gap-2">
          <AvatarStack seeds={event.going.operatorSeeds} />
          <p className="text-sm text-[#A4B1CD]">
            <span className="font-[family-name:var(--font-jetbrains-mono)] font-bold text-white">
              {event.going.operators?.toLocaleString() ?? "—"}
            </span>{" "}
            operators
          </p>
        </div>
      </Panel>

      <Panel className="overflow-hidden !p-0">
        <div className="border-b border-[#232C3D] p-5 pb-3.5">
          <PanelHeading>Specifications</PanelHeading>
        </div>
        <div className="grid grid-cols-2 gap-px bg-[#232C3D]">
          {event.specs.map((row) => (
            <div key={row.id} className="bg-[#151C2B] px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase text-[#6B7891]">{row.label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{row.value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </aside>
  );
}
