# Contests feature

Live CTF seasons, play board, scoreboard, and contest problem workspace.

## Structure

- `components/` — hub, detail, workspace shell, HUD, flag modal, lab toasts
- `arena/` — hub/play/lobby/scoreboard UI (CTF chrome)
- `arena/lib/` — view models, mappers, category metadata, mock feed data
- `contests-api.ts` — HTTP client for `/api/contests/*`

## Route map

| Route | Entry component |
|-------|-----------------|
| `/contests` | `ContestsHubView` / `ContestsView` |
| `/contests/[slug]` | `ContestDetailView` |
| `/contests/[slug]/play` | `EventPlay` |
| `/contests/[slug]/scoreboard` | `EventScoreboard` |
| `/contests/[slug]/problems/[exerciseSlug]` | `ContestWorkspaceShell` |

Do not import `arena/` from other features; use shared types in `@/types/contest` if needed.
