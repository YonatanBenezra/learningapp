import { authApi } from "@/features/auth/auth-api";
import {
  clearCachedAuthUser,
  readCachedAuthUser,
  writeCachedAuthUser,
} from "@/features/auth/auth-user-cache";
import { ApiError } from "@/lib/api-client";
import type { User } from "@/types/user";

type AuthSnapshot =
  | { status: "unknown" }
  | { status: "authenticated"; user: User }
  | { status: "anonymous" }
  | { status: "soft" };

let snapshot: AuthSnapshot = { status: "unknown" };
let inflight: Promise<AuthSnapshot> | null = null;
let storageBootstrapped = false;
const listeners = new Set<() => void>();

function notifyAuthListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function setSnapshot(next: AuthSnapshot) {
  snapshot = next;
  notifyAuthListeners();
}

function bootstrapFromSessionStorage() {
  if (storageBootstrapped || typeof window === "undefined") {
    return;
  }
  storageBootstrapped = true;
  if (snapshot.status !== "unknown") {
    return;
  }
  const cached = readCachedAuthUser();
  if (cached) {
    snapshot = { status: "authenticated", user: cached };
  }
}

export function subscribeAuthSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAuthSnapshot(): AuthSnapshot {
  bootstrapFromSessionStorage();
  return snapshot;
}

const SERVER_AUTH_SNAPSHOT: AuthSnapshot = { status: "unknown" };

export function getAuthServerSnapshot(): AuthSnapshot {
  return SERVER_AUTH_SNAPSHOT;
}

export function setAuthenticatedUser(user: User) {
  writeCachedAuthUser(user);
  setSnapshot({ status: "authenticated", user });
}

export function clearAuthSnapshot() {
  clearCachedAuthUser();
  inflight = null;
  setSnapshot({ status: "anonymous" });
}

export async function ensureAuthSession(force = false): Promise<AuthSnapshot> {
  bootstrapFromSessionStorage();

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
      writeCachedAuthUser(user);
      setSnapshot({ status: "authenticated", user });
      return snapshot;
    })
    .catch((caught: unknown) => {
      if (caught instanceof ApiError && caught.status === 401) {
        clearCachedAuthUser();
        setSnapshot({ status: "anonymous" });
      } else {
        const cached = readCachedAuthUser();
        if (cached) {
          setSnapshot({ status: "authenticated", user: cached });
        } else {
          setSnapshot({ status: "soft" });
        }
      }
      return snapshot;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
