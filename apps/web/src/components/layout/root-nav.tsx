"use client";

import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { HomeNav } from "@/features/home/home-nav";
import { ProblemNav } from "@/features/workspace/components/problem-nav";
import "@/features/home/home.css";

const DASHBOARD_PREFIXES = [routes.progress, routes.account];

function isDashboardPath(pathname: string) {
  return DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function exerciseSlugFromPath(pathname: string) {
  const match = pathname.match(/^\/exercises\/([^/]+)/);
  return match?.[1] ?? null;
}

/** Persistent site navbar — problem workspace uses a dedicated bar. */
export function RootNav() {
  const pathname = usePathname();
  const exerciseSlug = exerciseSlugFromPath(pathname);

  if (exerciseSlug) {
    return <ProblemNav slug={exerciseSlug} />;
  }

  if (isDashboardPath(pathname)) {
    return <DashboardNav />;
  }

  return <HomeNav />;
}
