export const routes = {
  home: "/",
  contact: "/contact",
  signIn: "/sign-in",
  signUp: "/sign-up",
  /** @deprecated Use {@link routes.signIn} */
  login: "/login",
  /** @deprecated Use {@link routes.signUp} */
  register: "/register",
  /** @deprecated Redirects to {@link routes.practiceHub}. */
  problems: "/problems",
  /** Legacy — redirects to {@link routes.problems}. */
  simulations: "/simulations",
  /** Static UI preview — mocked grading, no API catalogue required. */
  demoRagWorkspace: "/demo/rag-workspace",
  demoRagTrace: "/demo/rag-trace",
  demoG1Run: "/demo/g1-run",
  paths: "/paths",
  path: (slug: string) => `/paths/${slug}`,
  onboarding: "/onboarding",
  exercise: (slug: string) => `/exercises/${slug}`,
  run: (id: string) => `/runs/${id}`,
  trace: (id: string) => `/runs/${id}/trace`,
  /** Platform rankings (requires sign-in). */
  dashboardRanking: "/dashboard/ranking",
  /** @deprecated Redirects to {@link routes.dashboardRanking}. */
  leaderboard: "/leaderboard",
  /** Root redirects to {@link routes.contestHub}; `/contests/:slug/*` stays for live events. */
  contests: "/contests",
  contest: (slug: string) => `/contests/${slug}`,
  contestPlay: (slug: string) => `/contests/${slug}/play`,
  contestScoreboard: (slug: string) => `/contests/${slug}/scoreboard`,
  /** Alias — redirects to {@link routes.contestScoreboard}. */
  contestLeaderboard: (slug: string) => `/contests/${slug}/leaderboard`,
  contestProblem: (contestSlug: string, exerciseSlug: string) =>
    `/contests/${contestSlug}/problems/${exerciseSlug}`,
  contestPracticeProblem: (contestSlug: string, exerciseSlug: string) =>
    `/contests/${contestSlug}/practice/${exerciseSlug}`,
  assessments: "/assessments",
  assessment: (slug: string) => `/assessments/${slug}`,
  assessmentProblem: (assessmentSlug: string, exerciseSlug: string) =>
    `/assessments/${assessmentSlug}/problems/${exerciseSlug}`,
  dashboard: "/dashboard",
  dashboardProfile: "/dashboard/profile",
  dashboardSettings: "/dashboard/settings",
  /** HTB-style contests workspace (dashboard shell, not under /dashboard/*). */
  /** CTF contests workspace — label: "Contests" ({@link workspaceContests}). */
  contestHub: "/contest",
  /** Hands-on labs listing (dashboard workspace, CTF-style hub). */
  /** Practice workspace — label: "Practice" ({@link workspacePractice}). */
  practiceHub: "/practice",
  /** CTF event details (first stop after picking an event from the hub). */
  ctfEvent: (id: string) => `/events/${id}`,
  /** Same URL as dashboard — kept for call sites that still use `routes.progress`. */
  progress: "/dashboard",
  billing: "/billing",
  /** Account / edit profile (dashboard workspace). */
  account: "/dashboard/profile",
  profile: (slug: string) => `/u/${slug}`,
  profileReport: (slug: string) => `/u/${slug}/report`,
  verifyResult: (resultId: string) => `/verify/${resultId}`,
} as const;

export function loginPath(next?: string) {
  if (!next || next === routes.signIn) {
    return routes.signIn;
  }
  return `${routes.signIn}?next=${encodeURIComponent(next)}`;
}

export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return routes.dashboard;
  }
  return value;
}

function isGenericPostAuthLanding(path: string): boolean {
  return (
    path === routes.dashboard ||
    path === routes.practiceHub ||
    path === routes.contestHub ||
    path === routes.dashboardRanking ||
    path === routes.problems ||
    path === routes.contests ||
    path === routes.home ||
    path === routes.login ||
    path === routes.signIn
  );
}

export function postAuthPath(
  onboardingNeeded: boolean,
  intended?: string | null,
): string {
  const next = safeNext(intended);
  if (onboardingNeeded && isGenericPostAuthLanding(next)) {
    return routes.onboarding;
  }
  return next;
}
