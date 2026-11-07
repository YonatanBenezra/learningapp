import { routes } from "@/config/routes";

/** LabPath CTF is solo — link only when we have a real profile slug from the API. */
export function operatorProfileHref(id: string): string | null {
  if (!id || id.startsWith("mock-") || id.startsWith("rank-")) {
    return null;
  }
  return routes.profile(id);
}
