"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  ensureAuthSession,
  getAuthSnapshot,
  subscribeAuthSession,
} from "@/features/auth/auth-session";
import type { User } from "@/types/user";

function isSignedInStatus(status: string) {
  return status === "authenticated" || status === "soft";
}

export type AuthSessionView = {
  status: ReturnType<typeof getAuthSnapshot>["status"];
  user: User | null;
  signedIn: boolean;
  /** True once `/api/me` has settled (authenticated or anonymous). */
  resolved: boolean;
};

const SERVER_AUTH_VIEW: AuthSessionView = {
  status: "unknown",
  user: null,
  signedIn: false,
  resolved: false,
};

let cachedView: AuthSessionView = SERVER_AUTH_VIEW;

function toView(): AuthSessionView {
  const snap = getAuthSnapshot();
  const user: User | null =
    snap.status === "authenticated" ? snap.user : null;
  const signedIn =
    isSignedInStatus(snap.status) ||
    (snap.status === "unknown" && user !== null);
  const resolved =
    snap.status === "authenticated" ||
    snap.status === "anonymous" ||
    snap.status === "soft";

  if (
    cachedView.status === snap.status &&
    cachedView.user === user &&
    cachedView.signedIn === signedIn &&
    cachedView.resolved === resolved
  ) {
    return cachedView;
  }

  cachedView = {
    status: snap.status,
    user,
    signedIn,
    resolved,
  };
  return cachedView;
}

export function useAuthSession(options?: { verify?: boolean }) {
  const verify = options?.verify ?? true;

  const view = useSyncExternalStore(
    subscribeAuthSession,
    toView,
    () => SERVER_AUTH_VIEW,
  );

  useEffect(() => {
    if (!verify) {
      return;
    }
    void ensureAuthSession();
  }, [verify]);

  return view;
}

export function authUserInitials(user: User | null) {
  if (!user) {
    return "?";
  }
  const source = user.displayName?.trim() || user.email.split("@")[0] || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
