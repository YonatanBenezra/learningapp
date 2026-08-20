# @aieng/web

Next.js frontend for the AI engineering practice platform.

Part of the **aieng-platform** monorepo. See [../../ARCHITECTURE.md](../../ARCHITECTURE.md) and [../../README.md](../../README.md).

## Quick start

```bash
# From repo root
npm install
npm run build -w @aieng/shared
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000). API should run on `:4000`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:e2e` | Playwright |

## Environment

```bash
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://localhost:4000
```
