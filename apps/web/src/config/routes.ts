export const routes = {
  home: "/",
  login: "/login",
  catalogue: "/catalogue",
  paths: "/paths",
  path: (slug: string) => `/paths/${slug}`,
  onboarding: "/onboarding",
  exercise: (slug: string) => `/exercises/${slug}`,
  run: (id: string) => `/runs/${id}`,
  trace: (id: string) => `/runs/${id}/trace`,
  leaderboard: "/leaderboard",
  progress: "/progress",
  billing: "/billing",
  profile: (slug: string) => `/u/${slug}`,
} as const;

export function loginPath(next?: string) {
  if (!next || next === routes.login) {
    return routes.login;
  }
  return `${routes.login}?next=${encodeURIComponent(next)}`;
}

export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return routes.catalogue;
  }
  return value;
}

export function postAuthPath(
  onboardingNeeded: boolean,
  intended?: string | null,
): string {
  const next = safeNext(intended);
  if (
    onboardingNeeded &&
    (next === routes.catalogue || next === routes.home || next === routes.login)
  ) {
    return routes.onboarding;
  }
  return next;
}
