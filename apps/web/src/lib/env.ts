const DEFAULT_DEV_API = "http://localhost:3001/api";

function normalizeApiBase(url: string): string {
  return url.replace(/\/$/, "");
}

/** Browser: prod nginx uses same-origin `/api`; local dev uses Nest :3001 or env. */
export function apiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL
    ? normalizeApiBase(process.env.NEXT_PUBLIC_API_URL)
    : null;

  if (typeof window !== "undefined") {
    if (configured?.startsWith("http")) {
      return configured;
    }
    if (configured?.startsWith("/")) {
      return `${window.location.origin}${configured}`;
    }

    const { hostname, port, origin } = window.location;
    const isLocalDev =
      (hostname === "localhost" || hostname === "127.0.0.1") &&
      (port === "3000" || port === "");

    if (isLocalDev) {
      return DEFAULT_DEV_API;
    }

    return `${origin}/api`;
  }

  return configured ?? DEFAULT_DEV_API;
}

/** @deprecated Prefer `apiUrl()`. */
export const env = {
  get apiUrl() {
    return apiUrl();
  },
};
