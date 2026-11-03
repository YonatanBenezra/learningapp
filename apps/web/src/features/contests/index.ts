/**
 * Public entry points for the contests feature (for routes and cross-layer imports).
 * Prefer importing specific modules in new code; this barrel documents the surface.
 */

export { ContestsHubView } from "./components/contests-hub-view";
export { ContestsView } from "./components/contests-view";
export { ContestDetailView } from "./components/contest-detail-view";
export { ContestWorkspaceShell } from "./components/contest-workspace-shell";
export { EventPlay } from "./arena/play/EventPlay";
export { EventScoreboard } from "./arena/scoreboard/EventScoreboard";
export { ArenaPage } from "./arena/ArenaPage";
export { contestsApi } from "./contests-api";
