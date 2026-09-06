import { authApi } from "@/features/auth/auth-api";
import { ApiError } from "@/lib/api-client";
import type { User } from "@/types/user";

type AuthSnapshot =
  | { status: "unknown" }
  | { status: "authenticated"; user: User }
  | { status: "anonymous" }
  | { status: "soft" };

let snapshot: AuthSnapshot = { status: "unknown" };
let inflight: Promise<AuthSnapshot> | null = null;

export function getAuthSnapshot(): AuthSnapshot {
  return snapshot;
}

export function setAuthenticatedUser(user: User) {
  snapshot = { status: "authenticated", user };
}

export function clearAuthSnapshot() {
  snapshot = { status: "unknown" };
  inflight = null;
}

export async function ensureAuthSession(force = false): Promise<AuthSnapshot> {
  if (
    !force &&
    (snapshot.status === "authenticated" ||
      snapshot.status === "anonymous" ||
      snapshot.status === "soft")
  ) {
    return snapshot;
  }
  if (inflight) {
    return inflight;
  }

  inflight = authApi
    .me()
    .then((user) => {
      snapshot = { status: "authenticated", user };
      return snapshot;
    })
    .catch((caught: unknown) => {
      if (caught instanceof ApiError && caught.status === 401) {
        snapshot = { status: "anonymous" };
      } else {
        snapshot = { status: "soft" };
      }
      return snapshot;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
