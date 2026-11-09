"use client";

import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import { AppCatalogNav } from "@/components/layout/app-catalog-nav";
import {
  isAppCatalogPath,
  isContestWorkspacePath,
  isPracticePath,
} from "@/components/layout/nav-routes";
import { ArenaEventNav } from "@/features/contests/arena/play/ArenaEventNav";
import { OnboardingProblemNav } from "@/features/onboarding/onboarding-problem-nav";
import { HomeNav } from "@/features/home/home-nav";
import "@/features/home/home.css";

/** Persistent site navbar — catalogue vs simulator practice. */
function isAuthPath(pathname: string) {
  return (
    pathname === routes.signIn ||
    pathname === routes.signUp ||
    pathname === routes.login ||
    pathname === routes.register ||
    pathname === "/magic-link"
  );
}

export function RootNav() {
  const pathname = usePathname();

  if (isAuthPath(pathname)) {
    return null;
  }

  /** Public profiles (`/u/:slug`) use {@link DashboardHtbShell} chrome only — hide global marketing nav. */
  if (pathname === "/u" || pathname.startsWith("/u/")) {
    return null;
  }

  if (
    pathname === routes.dashboard ||
    pathname.startsWith(`${routes.dashboard}/`) ||
    pathname === routes.contestHub ||
    pathname === routes.practiceHub ||
    pathname.startsWith("/events/")
  ) {
    return null;
  }

  if (pathname === routes.onboarding) {
    return <OnboardingProblemNav />;
  }

  /* Simulator / contest lab: no global site nav — in-shell chrome only. */
  if (isPracticePath(pathname) || isContestWorkspacePath(pathname)) {
    return null;
  }

  if (/^\/contests\/[^/]+\/(arena|scoreboard)\/?$/.test(pathname)) {
    return <ArenaEventNav />;
  }

  if (isAppCatalogPath(pathname)) {
    return <AppCatalogNav />;
  }

  return <HomeNav />;
}
