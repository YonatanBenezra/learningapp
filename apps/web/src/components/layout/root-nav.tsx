"use client";

import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import { AppCatalogNav } from "@/components/layout/app-catalog-nav";
import { isAppCatalogPath, isPracticePath } from "@/components/layout/nav-routes";
import { OnboardingProblemNav } from "@/features/onboarding/onboarding-problem-nav";
import { HomeNav } from "@/features/home/home-nav";
import "@/features/home/home.css";

/** Persistent site navbar — catalogue vs simulator practice. */
function isAuthPath(pathname: string) {
  return pathname === routes.login || pathname === routes.register;
}

export function RootNav() {
  const pathname = usePathname();

  if (isAuthPath(pathname)) {
    return null;
  }

  if (pathname === routes.onboarding) {
    return <OnboardingProblemNav />;
  }

  /* Simulator workspace: no global site nav — use lp-ws back tab + in-shell chrome. */
  if (isPracticePath(pathname)) {
    return null;
  }

  if (isAppCatalogPath(pathname)) {
    return <AppCatalogNav />;
  }

  return <HomeNav />;
}
