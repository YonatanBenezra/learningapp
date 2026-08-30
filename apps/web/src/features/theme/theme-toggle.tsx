"use client";

import { applyTheme, readTheme, type Theme } from "./theme";
import "./theme-toggle.css";

export function ThemeToggle() {
  function toggle() {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
  }

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
