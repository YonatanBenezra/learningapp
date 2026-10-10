import type { User } from "@/types/user";

const STORAGE_KEY = "lp-auth-user-v1";

export function readCachedAuthUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as User;
    if (
      typeof parsed?.id !== "string" ||
      typeof parsed?.email !== "string" ||
      parsed.id.length === 0
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeCachedAuthUser(user: User) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Private mode or quota — ignore.
  }
}

export function clearCachedAuthUser() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
