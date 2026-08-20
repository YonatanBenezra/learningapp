# Architecture

## Overview

This monorepo powers an **AI engineering practice platform**: users solve AI/ML/LLM problems and receive AI-generated feedback. The codebase is being pivoted from a full LMS toward a minimal LeetCode-style experience (see `docs/MVP-AI-Engineering-Platform-Requirements.md`).

```
┌─────────────────────────────────────────────────────────────┐
│                        apps/web                              │
│  Next.js · App Router · React 19 · Tailwind                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ app/ routes │  │ src/features │  │ src/components   │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│         │                  │                                 │
│         └──────────┬───────┘                                 │
│                    ▼                                         │
│            src/infrastructure/apiClient                      │
│            (proxies /api → backend)                          │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        apps/api                              │
│  Express · Mongoose · BullMQ · Zod                           │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │ modules/*    │  │ jobs/*      │  │ middlewares/*      │  │
│  │ (domain API) │  │ (workers)   │  │ (auth, rate limit) │  │
│  └──────────────┘  └─────────────┘  └────────────────────┘  │
│         │                                                    │
│         ▼                                                    │
│  MongoDB · Redis · OpenRouter (AI)                           │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   packages/shared                            │
│  AI category names · practice limits · guest storage keys    │
│  (no UI, no DB — pure TypeScript constants/types)            │
└─────────────────────────────────────────────────────────────┘
```

## Monorepo conventions

### Workspace packages

| Package | Role | Deployable |
|---------|------|------------|
| `@aieng/web` | Browser UI, SSR, API proxy route | Yes (Vercel/Docker) |
| `@aieng/api` | REST API + background workers | Yes (Node host) |
| `@aieng/shared` | Shared constants/types | No (library) |

### Dependency rule

```
apps/web  ──► @aieng/shared
apps/api  ──► @aieng/shared

apps/web  ──X──► apps/api   (never import server code in web)
```

- **Shared** must not import from apps.
- **Web** talks to **API** only over HTTP (or Next.js `app/api/[...path]` proxy).
- Domain logic stays in `apps/api/src/modules/`.
- UI feature logic stays in `apps/web/src/features/`.

## apps/web structure

```
apps/web/
├── app/                    # Next.js routes (thin pages)
│   ├── (auth)/             # login, signup
│   ├── (app)/              # authenticated learner shell (legacy LMS)
│   ├── assessment/         # public skill assessments
│   └── api/[...path]/      # reverse proxy to @aieng/api
├── src/
│   ├── components/         # shared UI (ui/, layout/, marketing/)
│   ├── features/           # feature modules (api + hooks + views)
│   ├── domain/             # TypeScript entity types (client-side)
│   ├── constants/          # web-only constants + UI metadata
│   ├── infrastructure/     # apiClient, query client
│   ├── i18n/               # locales (trim for MVP)
│   └── store/              # Zustand (auth, etc.)
└── e2e/                    # Playwright
```

**Feature module pattern** (`src/features/<name>/`):

- `<name>Api.ts` — fetch functions
- `use<Name>.ts` — React Query hooks
- `*Page.tsx` / `*View.tsx` — UI

## apps/api structure

```
apps/api/
├── src/
│   ├── app.ts              # Express app, route mounting
│   ├── server.ts           # HTTP server bootstrap
│   ├── config/             # env, redis, tiers
│   ├── common/             # shared utils, constants, validation
│   ├── middlewares/        # auth, rate limits, entitlements
│   ├── modules/            # domain modules (vertical slices)
│   │   ├── assessments/
│   │   ├── exercises/
│   │   ├── ai-guidance/
│   │   ├── auth/
│   │   └── ...
│   └── jobs/               # BullMQ workers
└── tests/                  # Vitest + supertest
```

**Module pattern** (`src/modules/<domain>/`):

- `<domain>.routes.ts` — Express router
- `<domain>.controller.ts` — HTTP handlers
- `<domain>.service.ts` — business logic
- `<domain>.model.ts` — Mongoose schema
- `<domain>.validation.ts` — Zod schemas

## packages/shared structure

```
packages/shared/
└── src/
    ├── constants/
    │   ├── aiCategories.ts   # canonical AI topic names
    │   └── practice.ts       # FREE_PROBLEM_LIMIT, storage keys
    └── index.ts              # public exports
```

Build before API compile: `npm run build -w @aieng/shared`

## MVP target architecture (in progress)

Legacy LMS modules (courses, instructor, marketplace) remain in the repo but will be **hidden** from the MVP UI. New MVP surface:

1. **`/`** — instant practice (problem view)
2. **`POST /problems/:slug/submit`** — guest (Q1–3) + authed (Q4+)
3. **`POST /practice/sync`** — localStorage → DB after login
4. **`packages/shared`** — single source for category names & free-tier limit

## Data stores

| Store | Usage |
|-------|--------|
| MongoDB | Users, submissions, problems (MVP), legacy courses |
| Redis | BullMQ job queues |
| localStorage | Guest practice bundle (Q1–3 before sync) |

## CI pipeline

GitHub Actions (`/.github/workflows/ci.yml`):

1. Build & typecheck `@aieng/shared`
2. Lint, build, test `@aieng/api` (Mongo + Redis services)
3. Typecheck & lint `@aieng/web`

## Migration notes (rename history)

| Before | After |
|--------|-------|
| `b2c-frontend/` | `apps/web/` |
| `b2c-backend/` | `apps/api/` |
| Package names `b2c-*` | `@aieng/web`, `@aieng/api`, `@aieng/shared` |

Update any local scripts, IDE run configs, or deploy paths that still reference the old folder names.
