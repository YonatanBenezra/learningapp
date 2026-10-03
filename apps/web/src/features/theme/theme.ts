export type Theme = "light" | "dark";

export const THEME_KEY = "labpath-theme";

function syncDarkClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function readTheme(): Theme {
  return "dark";
}

export function applyTheme(_theme: Theme) {
  document.documentElement.setAttribute("data-theme", "dark");
  syncDarkClass("dark");
  localStorage.setItem(THEME_KEY, "dark");
}
