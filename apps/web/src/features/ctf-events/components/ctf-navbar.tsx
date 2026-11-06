"use client";

import { CalendarPlus, DollarSign, Plus, Trophy, Users } from "lucide-react";
import { routes } from "@/config/routes";
import { HubNavbar, type HubNavItem } from "@/features/workspace-hub/hub-navbar";

const ITEMS: HubNavItem[] = [
  {
    label: "Events",
    href: routes.contestHub,
    icon: Trophy,
    match: (p) => p === routes.contestHub,
  },
  { label: "Teams", href: routes.contestHub, icon: Users },
  { label: "Host your event", href: routes.contestHub, icon: CalendarPlus },
  { label: "Pricing", href: routes.contestHub, icon: DollarSign },
];

export function CtfNavbar() {
  return (
    <HubNavbar
      hubHref={routes.contestHub}
      hubSuffix="CTF"
      ariaLabel="CTF workspace"
      items={ITEMS}
      primaryAction={
        <button
          type="button"
          className="mr-1 inline-flex h-10 items-center gap-2 rounded bg-platform-accent px-5 text-[calc(0.875rem+0.5px)] font-semibold text-platform-accent-on transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" strokeWidth={2.25} aria-hidden />
          Create Event
        </button>
      }
    />
  );
}
