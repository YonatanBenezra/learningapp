"use client";

import { useEffect } from "react";
import { HomeHeroSection } from "@/features/home/components/home-hero-section";
import { HomeHeroSkeleton } from "@/features/home/components/home-hero-skeleton";
import {
  useHomeShellReady,
  useMarkHomeShellReady,
} from "@/features/home/home-load-context";
import { cn } from "@/lib/utils";

const HOME_SHELL_MAX_MS = 4500;

export function HomeHeroShell() {
  const shellReady = useHomeShellReady();
  const markReady = useMarkHomeShellReady();

  useEffect(() => {
    if (shellReady || !markReady) {
      return;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      markReady();
      return;
    }

    const timeout = window.setTimeout(() => markReady(), HOME_SHELL_MAX_MS);
    return () => window.clearTimeout(timeout);
  }, [shellReady, markReady]);

  return (
    <section
      className={cn("lp-home-hero", shellReady && "is-shell-ready")}
      aria-labelledby={shellReady ? "home-hero-title" : undefined}
      aria-busy={!shellReady}
    >
      {!shellReady ? <HomeHeroSkeleton /> : null}
      <div
        className={cn(
          "lp-home-hero-live",
          !shellReady && "lp-home-hero-live--booting",
        )}
        aria-hidden={!shellReady}
      >
        <HomeHeroSection />
      </div>
    </section>
  );
}
