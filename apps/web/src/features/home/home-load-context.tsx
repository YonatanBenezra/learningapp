"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";

type HomeLoadContextValue = {
  markHomeShellReady: () => void;
};

const HomeLoadContext = createContext<HomeLoadContextValue | null>(null);

let homeShellReady = false;
const listeners = new Set<() => void>();

function subscribeHomeShell(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getHomeShellSnapshot() {
  return homeShellReady;
}

function getHomeShellServerSnapshot() {
  return false;
}

export function setHomeShellReady(next: boolean) {
  if (homeShellReady === next) {
    return;
  }
  homeShellReady = next;
  for (const listener of listeners) {
    listener();
  }
}

/** True when hero shell skeleton can hide (non-home routes are always ready). */
export function useHomeShellReady() {
  const pathname = usePathname();
  const isHome = pathname === routes.home;
  const ready = useSyncExternalStore(
    subscribeHomeShell,
    getHomeShellSnapshot,
    getHomeShellServerSnapshot,
  );

  return !isHome || ready;
}

export function useMarkHomeShellReady() {
  return useContext(HomeLoadContext)?.markHomeShellReady;
}

export function HomeLoadProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === routes.home) {
      setHomeShellReady(false);
      return;
    }
    setHomeShellReady(true);
  }, [pathname]);

  const markHomeShellReady = useCallback(() => {
    setHomeShellReady(true);
  }, []);

  return (
    <HomeLoadContext.Provider value={{ markHomeShellReady }}>
      {children}
    </HomeLoadContext.Provider>
  );
}
