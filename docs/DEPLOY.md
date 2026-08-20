# B2C deployment guide

## Prerequisites

- MongoDB + Redis (backend workers)
- Claude API key (AI generation/grading)
- Stripe keys (optional, for billing)

## Backend (`apps/api`)

1. Copy `apps/api/.env.example` → `apps/api/.env` and fill secrets.
2. Start API + workers:

```bash
npm install
npm run build -w @aieng/shared
cd apps/api
npm run dev          # API on :4000
```

Or from repo root: `npm run dev:api`

3. Production: set `CORS_ORIGIN` to your frontend URL (e.g. `https://app.example.com`).

## Frontend (`apps/web`)

1. Copy `.env.example` → `.env.local`:

```bash
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://localhost:4000
```

2. Local dev:

```bash
cd apps/web
npm install
npm run dev          # :3000 — ensure backend is on :4000
```

Or from repo root: `npm run dev:web`

3. Production build:

```bash
npm run build
npm run start
```

### Docker (frontend)

```bash
cd apps/web
docker build --build-arg NEXT_PUBLIC_API_URL=/api -t aieng-web .
docker run -p 3000:3000 -e BACKEND_URL=https://your-backend.onrender.com bina-b2c-web
```

## Render / Vercel

| Service | Suggested platform |
|---------|-------------------|
| Frontend | Vercel or Render Web Service (Docker) |
| Backend API | Render Web Service |
| Workers | Render Background Worker |
| MongoDB | MongoDB Atlas |
| Redis | Upstash or Render Redis |

**Frontend env (on the FRONTEND service only):**

| Variable | When | Value |
|----------|------|--------|
| `NEXT_PUBLIC_API_URL` | Build + runtime | `/api` |
| `BACKEND_URL` | Runtime only | `https://your-backend.onrender.com` |

After deploy, open `https://your-frontend-domain/api/health` — `backendUrlConfigured` and `ok` must both be `true`.

**Backend env (on the BACKEND service):**

- `AUTH_COOKIE_PATH=/api`
- `CORS_ORIGIN` → frontend URL (e.g. `https://your-frontend.onrender.com`)
- `MONGO_URI`, `REDIS_URL`, `AI_PROVIDER_API_KEY`, JWT secrets, Stripe keys

Do **not** set `NEXT_PUBLIC_API_URL` to the backend URL — login cookies use path `/api` and will break.

## Health checks

- Backend: `GET /health` (if exposed) or any public route
- Frontend: `GET /` returns 200

## E2E tests

Smoke tests (no backend required):

```bash
cd apps/web
npm run test:e2e
```

Full flow (requires backend + AI key):

```bash
E2E_API_URL=http://localhost:4000 npm run test:e2e -- e2e/core-flow.spec.ts
```

Optional credentials (reuse existing user instead of signup):

```bash
E2E_EMAIL=you@example.com E2E_PASSWORD=secret npm run test:e2e -- e2e/core-flow.spec.ts
```

## Admin access

Promote a user to admin in MongoDB:

```js
db.users.updateOne({ email: 'admin@example.com' }, { $set: { role: 'admin' } })
```

Then visit `/admin/metrics`.
