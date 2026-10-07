import { routes } from "@/config/routes";

/** Simulator practice: exercise workspace, runs, demos. */
export function isPracticePath(pathname: string): boolean {
  return (
    pathname.startsWith("/exercises/") ||
    pathname.startsWith("/runs/") ||
    pathname.startsWith("/demo/")
  );
}

/** Catalogue app: dashboard, problems, contest, simulators (+ home). */
export function isAppCatalogPath(pathname: string): boolean {
  if (pathname === routes.onboarding) {
    return false;
  }
  if (isPracticePath(pathname)) {
    return false;
  }
  if (pathname === routes.home) {
    return true;
  }
  if (pathname === routes.dashboard || pathname.startsWith(`${routes.dashboard}/`)) {
    return true;
  }
  if (pathname === routes.account || pathname.startsWith(`${routes.account}/`)) {
    return true;
  }
  if (
    pathname === routes.problems ||
    pathname === routes.contests ||
    pathname.startsWith(`${routes.contests}/`) ||
    pathname === routes.leaderboard ||
    pathname === routes.paths ||
    pathname.startsWith(`${routes.paths}/`)
  ) {
    return true;
  }
  return false;
}

export function exerciseSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/exercises\/([^/]+)/);
  return match?.[1] ?? null;
}
