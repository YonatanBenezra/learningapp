# @aieng/api

Express REST API for the AI engineering practice platform.

Part of the **aieng-platform** monorepo. See [../../ARCHITECTURE.md](../../ARCHITECTURE.md) and [../../README.md](../../README.md).

## Quick start

```bash
# From repo root
npm install
npm run build -w @aieng/shared
npm run dev:api
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | tsx watch `src/server.ts` |
| `npm run build` | `tsc` → `dist/` |
| `npm run test` | Vitest |
| `npm run lint` | ESLint |

## Environment

Copy `.env.example` → `.env`. Requires MongoDB and Redis for full functionality.
