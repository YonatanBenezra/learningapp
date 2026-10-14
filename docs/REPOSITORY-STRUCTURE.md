# Repository structure

LabPath is an **npm workspaces monorepo** (Node ≥ 20): two deployable apps, shared infra, and product docs. This matches common “apps + infra + docs” layout used by production teams.

## Top level

| Path | Purpose |
|------|---------|
| `apps/api/` | NestJS **HTTP API** (`main.ts`) and **grading worker** (`worker.ts`) — same package, two processes |
| `apps/web/` | Next.js App Router frontend |
| `infra/` | Postgres init, sandbox images (local/dev) |
| `docs/` | Product spec, design notes, generated reports |
| `scripts/` | Repo-wide dev orchestration (`dev.mjs` → API + worker + web) |
| `.github/workflows/` | CI and GCP deploy |

There is **no `packages/` shared library** yet: types and API clients live in `apps/web/src/types` and feature `*-api.ts` files. Add `packages/shared` only when duplication hurts.

---

## `apps/api` (backend)

```
apps/api/
  src/
    main.ts, worker.ts          # entrypoints
    app.module.ts, worker.module.ts
    core/                       # cross-cutting: config, prisma, redis, queue, health, logger
    common/                     # guards, pipes, filters, validation, cookies
    modules/                    # domain modules (Nest feature boundaries)
      identity/                 # auth, users, magic link
      catalogue/                # exercises, paths, skills (public catalogue)
      practice/                 # attempts, submissions, runs, grades, hints
      grading/                  # worker-only: harnesses, gateway, pipeline
      progress/, contests/, leaderboard/, assessments/, billing/, …
    content/                    # TypeScript: content validation / pipeline helpers (not exercise JSON)
    bootstrap/
  content/                      # on-disk exercise assets (eval JSON, meta, corpora)
  prisma/                       # schema, migrations, seed
  scripts/content/              # catalogue sync, validate, generators (CLI)
  test/                         # e2e and integration tests
  var/                          # local runtime (traces, caches) — gitignored
```

**Design rules**

- **HTTP never grades inline** — API enqueues BullMQ jobs; worker runs `GradingPipeline`.
- **Hidden eval** lives under `content/exercises/` and `harness.exercise_assets` URIs; sync with `npm run content:sync-catalogue -w @labpath/api` on **each machine/environment** so `file:` paths match that host.
- **`src/content/` vs `content/`** — code vs authored data; intentional split.

---

## `apps/web` (frontend)

```
apps/web/
  src/
    app/                        # routes only (thin pages)
      page.tsx                  # marketing home
      (auth)/                   # login, register, magic-link
      (app)/                    # catalogue app (problems, exercises, contests, …)
      (dashboard)/              # account: dashboard, profile, billing
      u/, verify/               # public profile, verify result
    features/                   # feature modules: UI + *-api.ts + *.css
      workspace/                # simulators (largest surface)
      problems/, contests/, auth/, …
    components/                 # shared UI: layout, brand, shadcn wrappers
    config/                     # routes, brand
    lib/                        # api client, env, utils
    types/                      # DTO shapes aligned with API
  public/                       # static assets
```

**Design rules**

- **Route groups** `(app)`, `(auth)`, `(dashboard)` control layout and auth gates without affecting URLs.
- **Features own** their API calls and styles; `app/**/page.tsx` imports views from `features/`.
- **Browser API base**: prefer same-origin `NEXT_PUBLIC_API_URL=/api` behind nginx in production.

---

## `infra/`

| Path | Purpose |
|------|---------|
| `infra/postgres/` | pgvector init for Docker Compose |
| `infra/sandbox/` | Agent/sandbox runner image and gateway (optional local stack) |

Root `docker-compose.yml` wires Postgres, Redis, and optional sandbox services.

---

## `docs/`

| Path | Purpose |
|------|---------|
| `docs/specification/` | Canonical product spec (`LabPath-Specification.md`) |
| `docs/reports/` | One-off PDFs and build scripts (practice reports, etc.) |
| `docs/*.md` | Feature design notes (e.g. RAG simulator BN) |

---

## What we intentionally avoid

- Flattening API and web into one app (different deploy processes and scaling).
- Committing `dist/`, `.next/`, `apps/api/var/` (gitignored).
- Storing absolute dev-machine paths in production DB (run catalogue sync on the server).

For architecture and request flows, see the main [README](../README.md#architecture).
