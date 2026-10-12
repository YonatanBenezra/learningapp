"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  applyTheme,
  getThemeClientSnapshot,
  getThemeServerSnapshot,
  readTheme,
  subscribeTheme,
  type Theme,
} from "./theme";
import "./theme-toggle.css";

type ThemeToggleProps = {
  /** Floating rail (legacy) vs compact navbar control */
  variant?: "floating" | "nav";
};

export function ThemeToggle({ variant = "nav" }: ThemeToggleProps) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeClientSnapshot,
    getThemeServerSnapshot,
  );

  function toggle() {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
  }

  if (variant === "floating") {
    return (
      <button
        type="button"
        className="lp-theme-switch"
        aria-label="Toggle color theme"
        onClick={toggle}
      >
        <span className="lp-theme-knob" aria-hidden="true" />
        <svg className="lp-theme-sun" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <path
            d="M12 2.4v2M12 19.6v2M2.4 12h2M19.6 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="lp-theme-nav-btn"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      onClick={toggle}
    >
      {isDark ? (
        <Moon className="size-[1.05rem]" strokeWidth={2} aria-hidden />
      ) : (
        <Sun className="size-[1.05rem]" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
