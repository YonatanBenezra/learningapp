export type Theme = "light" | "dark";

export const THEME_KEY = "labpath-theme";

const listeners = new Set<() => void>();

function notifyThemeChange() {
  for (const listener of listeners) {
    listener();
  }
}

function syncDom(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function readTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") {
    return attr;
  }
  return "dark";
}

export function applyTheme(theme: Theme) {
  syncDom(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
  notifyThemeChange();
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeClientSnapshot(): Theme {
  return readTheme();
}

export function getThemeServerSnapshot(): Theme {
  return "dark";
}
