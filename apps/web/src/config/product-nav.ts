import { routes } from "@/config/routes";

/**
 * Signed-in product map — users sign in, use the dashboard, then open hubs from nav.
 */
export type ProductNavItem = {
  id: string;
  label: string;
  description: string;
  href: string;
};

/** Public catalog nav links (empty — hubs live under dashboard). */
export const catalogNavItems: readonly ProductNavItem[] = [] as const;

export const workspacePractice: ProductNavItem = {
  id: "practice",
  label: "Practice",
  description: "Hands-on RAG, eval, and guardrails labs",
  href: routes.practiceHub,
};

export const workspaceContests: ProductNavItem = {
  id: "contests",
  label: "Contests",
  description: "Join timed CTF contests from your account",
  href: routes.contestHub,
};

export const workspaceRanking: ProductNavItem = {
  id: "ranking",
  label: "Ranking",
  description: "Global standings and track progress",
  href: routes.dashboardRanking,
};

export const workspaceAppGroups: ReadonlyArray<{
  id: string;
  items: readonly ProductNavItem[];
}> = [
  {
    id: "workspace",
    items: [workspacePractice, workspaceContests, workspaceRanking],
  },
] as const;

export const catalogPrimaryCta = {
  signedOut: { label: "Get started", href: routes.signUp },
  signedIn: { label: "Dashboard", href: routes.dashboard },
} as const;

export const homePrimaryCta = {
  label: "Get started",
  href: routes.signUp,
} as const;

export const homeSignedInCta = {
  label: "Open dashboard",
  href: routes.dashboard,
} as const;
