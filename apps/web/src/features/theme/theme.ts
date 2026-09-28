export type Theme = "light" | "dark";

export const THEME_KEY = "labpath-theme";

function syncDarkClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function readTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  syncDarkClass(theme);
  localStorage.setItem(THEME_KEY, theme);
}
