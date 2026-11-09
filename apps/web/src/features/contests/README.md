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
| `/contest` | `CtfEventsView` (hub) |
| `/events/[slug]` | `EventDetailsView` (canonical pre-join) |
| `/contests/[slug]` | Redirect → `/events/[slug]` |
| `/contests/[slug]/arena` | `ContestPlayView` → `EventPlay` |
| `/contests/[slug]/scoreboard` | `EventScoreboard` → `CtfScoreboardPage` (single implementation) |
| `/contests/[slug]/problems/[exerciseSlug]` | `ContestWorkspaceShell` |

Do not import `arena/` from other features; use shared types in `@/types/contest` if needed.

**CTF vs assessment:** Live CTF uses `arena/` + `/events` + `/contests/.../arena`. Season
assessments use `components/contest-view.tsx` at `/assessments/[slug]` only — do not route CTF
operators through `ContestView`.

## Remediation plan

Phased cleanup (mock board → API, flow, scoreboard, backend): **[CONTEST-PHASES.md](./CONTEST-PHASES.md)**.
