import { routes } from "@/config/routes";

export function exerciseSlugFromNext(next: string | null): string | null {
  if (!next || !next.startsWith("/")) {
    return null;
  }
  const match = /^\/exercises\/([^/?#]+)/.exec(next);
  return match?.[1] ?? null;
}

export function isSimulatorNext(next: string | null): boolean {
  if (!next) {
    return false;
  }
  return (
    next.startsWith("/exercises/") ||
    next.startsWith("/contests/") ||
    next.startsWith("/assessments/")
  );
}

export function loginBackHref(next: string | null): string {
  if (isSimulatorNext(next)) {
    return routes.problems;
  }
  return routes.home;
}
