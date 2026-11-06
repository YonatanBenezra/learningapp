# Frontend: Feature-Based Modular Architecture

LabPath web uses **feature modules** under `src/features/`. Each feature is a vertical slice: UI, API client, styles, and feature-only logic live together. Routes in `src/app/` stay thin.

## Layering

| Layer | Path | Responsibility |
|-------|------|----------------|
| **Routes** | `src/app/**` | URL, metadata, auth layout; import one feature view |
| **Features** | `src/features/<name>/` | Product domains (contests, workspace, auth, …) |
| **Shared UI** | `src/components/` | Layout, brand, design-system wrappers (no domain rules) |
| **Shared lib** | `src/lib/` | API client, env, generic utils |
| **Types** | `src/types/` | DTOs aligned with API (cross-feature when shared) |
| **Config** | `src/config/` | Routes, brand constants |

## Feature module layout

```
features/<feature-name>/
  components/          # React UI for this feature only
  arena/               # (contests) sub-domain UI — hub, lobby, play, scoreboard
  arena/lib/           # mappers, mock data, view models for arena
  *-api.ts             # fetch wrappers for this feature’s API
  *.css                # feature-scoped styles
  hooks/               # optional
  lib/                 # optional feature utils (prefer colocated subfolders)
  README.md            # optional: boundaries and entry components
```

### Rules

1. **`app/**/page.tsx`** imports from `@/features/...`, not from deep paths in other features.
2. **No cross-feature imports** of `components/` or private `lib/` — use shared `components/` or `types/` instead.
3. **API calls** for a domain live in that feature (`contests-api.ts`, `leaderboard-api.ts`, …).
4. **Co-locate CSS** with the feature; avoid global styles except tokens in `app/globals.css`.
5. **Sub-modules** (e.g. `features/contests/arena/`) are allowed when one product area has clear sub-areas (hub vs play vs scoreboard).

## Contests feature (example)

```
features/contests/
  components/          # hub, detail, workspace shell, HUD, modals
  arena/               # CTF hub/play/lobby/scoreboard UI
  arena/lib/           # arena types, mappers, mock feed data
  contests-api.ts
  contest-clock.ts
  contests.css
```

Public entry views used by routes:

- `ContestsHubView` / `ContestsView` — hub & list
- `ContestDetailView` — event detail / lobby
- `ContestWorkspaceShell` — live problem workspace
- `EventPlay` — play board (`arena/play`)
- `EventScoreboard` — scoreboard (`arena/scoreboard`)

## Adding a new feature

1. Create `src/features/<name>/`.
2. Add `<name>-api.ts` if the feature talks to the API.
3. Add `components/<name>-view.tsx` (or `-page-content.tsx`) as the route entry.
4. Wire `src/app/.../page.tsx` to that component only.
5. Do not add domain logic under `src/components/`.

## Migration notes

- Legacy **`components/arena`** and **`lib/arena`** were moved to **`features/contests/arena`** and **`features/contests/arena/lib`**.
- Import path: `@/features/contests/arena/...` and `@/features/contests/arena/lib/...`.

See also [REPOSITORY-STRUCTURE.md](../../../docs/REPOSITORY-STRUCTURE.md).
