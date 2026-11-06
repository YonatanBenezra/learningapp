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
  if (pathname === routes.home || pathname === routes.contact) {
    return true;
  }
  if (pathname === routes.dashboard || pathname.startsWith(`${routes.dashboard}/`)) {
    return false;
  }
  if (
    pathname.startsWith(`${routes.contests}/`) ||
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
