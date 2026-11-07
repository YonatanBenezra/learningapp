import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { AvatarStack } from "@/features/contests/event-details/components/avatar-stack";
import { HexLogo } from "@/features/contests/event-details/components/hex-logo";
import { SpecItem } from "@/features/contests/event-details/components/spec-item";
import type { EventDetailsData } from "@/features/contests/event-details/types";

export function EventSidebar({ event }: { event: EventDetailsData }) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Event details sidebar">
      <section className="border-b border-[#232C3D] py-6 first:pt-0">
        <h3 className="text-sm font-semibold text-white">Hosted by</h3>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-[#1E2636]">
            <HexLogo size={22} />
          </span>
          <span className="text-sm font-semibold text-white">{event.host.name}</span>
        </div>
        <Link
          href={event.host.websiteUrl}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#9FEF00] underline-offset-4 hover:underline"
        >
          {event.host.websiteLabel}
          <ExternalLink className="size-3.5 opacity-80" aria-hidden />
        </Link>
      </section>

      <section className="border-b border-[#232C3D] py-6">
        <h3 className="text-sm font-semibold text-white">Going</h3>
        <div className="mt-4 flex items-center gap-3">
          <AvatarStack seeds={event.stats.playerAvatarSeeds} />
          <p className="text-sm text-[#A4B1CD]">
            <span className="font-semibold text-white">{event.stats.playersJoined.toLocaleString()}</span>{" "}
            players joined
          </p>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <AvatarStack seeds={event.stats.teamAvatarSeeds} />
          <p className="text-sm text-[#A4B1CD]">
            <span className="font-semibold text-white">{event.stats.teamsJoined.toLocaleString()}</span>{" "}
            teams joined
          </p>
        </div>
      </section>

      <section className="py-6">
        <h3 className="text-sm font-semibold text-white">Specifications</h3>
        <ul className="mt-2 divide-y divide-[#232C3D]">
          {event.specs.map((row) => (
            <SpecItem key={row.id} row={row} />
          ))}
        </ul>
      </section>
    </aside>
  );
}
