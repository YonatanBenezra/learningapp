export const routes = {
  home: "/",
  login: "/login",
  catalogue: "/catalogue",
  exercise: (slug: string) => `/exercises/${slug}`,
  run: (id: string) => `/runs/${id}`,
  trace: (id: string) => `/runs/${id}/trace`,
  progress: "/progress",
} as const;
