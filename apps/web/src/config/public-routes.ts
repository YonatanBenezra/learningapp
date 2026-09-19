import { routes } from "@/config/routes";

/** App routes that work without signing in (submit still requires auth). */
export function isPublicAppPath(pathname: string): boolean {
  if (
    pathname === routes.problems ||
    pathname === routes.contests ||
    pathname === routes.paths ||
    pathname === "/catalogue" ||
    pathname === routes.leaderboard
  ) {
    return true;
  }

  if (pathname.startsWith("/exercises/")) {
    return true;
  }

  if (/^\/contests\/[^/]+\/problems\/[^/]+/.test(pathname)) {
    return true;
  }

  return false;
}
