"use client";

import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import { HomeNav } from "@/features/home/home-nav";
import "@/features/home/home.css";

const DASHBOARD_PREFIXES = [routes.progress, routes.billing, routes.account];

function isDashboardPath(pathname: string) {
  return DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Persistent site navbar at the root — hidden only on dashboard routes. */
export function RootNav() {
  const pathname = usePathname();

  if (isDashboardPath(pathname)) {
    return null;
  }

  return <HomeNav />;
}
