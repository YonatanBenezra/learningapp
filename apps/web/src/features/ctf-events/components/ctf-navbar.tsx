"use client";

import { Trophy } from "lucide-react";
import { routes } from "@/config/routes";
import { HubNavbar, type HubNavItem } from "@/features/workspace-hub/hub-navbar";

const ITEMS: HubNavItem[] = [
  {
    label: "Events",
    href: routes.contestHub,
    icon: Trophy,
    match: (p) => p === routes.contestHub,
  },
];

export function CtfNavbar() {
  return (
    <HubNavbar
      hubHref={routes.contestHub}
      hubSuffix="CTF"
      ariaLabel="CTF workspace"
      items={ITEMS}
    />
  );
}
