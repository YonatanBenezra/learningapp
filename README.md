# AI Engineering Practice Platform

Monorepo for an AI-engineering practice product (LeetCode-style question bank + AI feedback).

## Repository layout

```
aieng-platform/
├── apps/
│   ├── web/                 @aieng/web   — Next.js 16 (App Router)
│   └── api/                 @aieng/api   — Express + MongoDB + BullMQ
├── packages/
│   └── shared/              @aieng/shared — cross-app constants & types
├── docs/                    product & deployment docs
├── package.json             npm workspaces root
└── ARCHITECTURE.md          system design
```

## Quick start

```bash
# Install all workspaces
npm install

# Build shared package (required before API compile)
npm run build -w @aieng/shared

# Terminal 1 — API (:4000)
npm run dev:api

# Terminal 2 — Web (:3000)
npm run dev:web
```

### Environment

- **API:** copy `apps/api/.env.example` → `apps/api/.env`
- **Web:** copy `apps/web/.env.example` → `apps/web/.env.local` (if present)

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://localhost:4000
```

## Scripts (root)

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Next.js dev server |
| `npm run dev:api` | Express API (tsx watch) |
| `npm run build` | Build shared → API → web |
| `npm run typecheck` | Typecheck all workspaces |
| `npm run test` | API unit/integration tests (Vitest) |
| `npm run test:e2e` | Playwright (apps/web) |

## Package naming

| Old path | New path | npm name |
|----------|----------|----------|
| `b2c-frontend/` | `apps/web/` | `@aieng/web` |
| `b2c-backend/` | `apps/api/` | `@aieng/api` |
| — | `packages/shared/` | `@aieng/shared` |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — monorepo & system design
- [docs/MVP-AI-Engineering-Platform-Requirements.md](./docs/MVP-AI-Engineering-Platform-Requirements.md) — MVP spec
- [docs/DEPLOY.md](./docs/DEPLOY.md) — deployment

## Tech stack

- **Web:** Next.js 16, React 19, Tailwind v4, TanStack Query, Zustand
- **API:** Express, Mongoose, BullMQ, Redis, Zod, Pino
- **AI:** OpenRouter (grading, generation)
- **Shared:** TypeScript constants (AI categories, practice limits)
