"use client";

import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { OnboardingProblemNav } from "@/features/onboarding/onboarding-problem-nav";
import { HomeNav } from "@/features/home/home-nav";
import "@/features/home/home.css";

const DASHBOARD_PREFIXES = [routes.dashboard, routes.account];

function isDashboardPath(pathname: string) {
  return DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Figma-style app bar: Problems, Simulators, search, Dashboard (full width). */
function usesCatalogueNav(pathname: string) {
  if (pathname === routes.home) {
    return true;
  }
  if (
    pathname.startsWith("/exercises/") ||
    pathname.startsWith("/demo/") ||
    pathname.startsWith("/runs/")
  ) {
    return true;
  }
  if (
    pathname === routes.problems ||
    pathname === routes.simulations ||
    pathname === routes.paths ||
    pathname.startsWith(`${routes.paths}/`) ||
    pathname === routes.leaderboard ||
    pathname === routes.contests ||
    pathname.startsWith(`${routes.contests}/`)
  ) {
    return true;
  }
  return isDashboardPath(pathname);
}

/** Persistent site navbar */
export function RootNav() {
  const pathname = usePathname();

  if (pathname === routes.onboarding) {
    return <OnboardingProblemNav />;
  }

  if (usesCatalogueNav(pathname)) {
    return <DashboardNav />;
  }

  return <HomeNav />;
}
