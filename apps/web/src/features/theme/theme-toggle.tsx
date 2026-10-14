"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  applyTheme,
  getThemeClientSnapshot,
  getThemeServerSnapshot,
  subscribeTheme,
  type Theme,
} from "./theme";
import "./theme-toggle.css";

type ThemeToggleProps = {
  /** Floating rail (legacy) vs navbar segmented control */
  variant?: "floating" | "nav";
};

export function ThemeToggle({ variant = "nav" }: ThemeToggleProps) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeClientSnapshot,
    getThemeServerSnapshot,
  );

  function setTheme(next: Theme) {
    applyTheme(next);
  }

  if (variant === "floating") {
    return (
      <button
        type="button"
        className="lp-theme-switch"
        aria-label="Toggle color theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
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
    <div className="lp-theme-segment" role="group" aria-label="Appearance">
      <button
        type="button"
        className={`lp-theme-segment-btn${!isDark ? " is-active" : ""}`}
        aria-label="Light theme"
        aria-pressed={!isDark}
        onClick={() => setTheme("light")}
      >
        <Sun className="lp-icon lp-icon--sm" strokeWidth={1.5} aria-hidden />
      </button>
      <button
        type="button"
        className={`lp-theme-segment-btn${isDark ? " is-active" : ""}`}
        aria-label="Dark theme"
        aria-pressed={isDark}
        onClick={() => setTheme("dark")}
      >
        <Moon className="lp-icon lp-icon--sm" strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}
