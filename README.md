# LabPath

Practice platform for AI engineering.

## Layout

```
apps/api     NestJS API + worker
apps/web     Next.js App Router
infra/       local Postgres (pgvector) + Redis
```

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
docker compose up -d
npm install
npm run prisma:generate
npm run dev:api
npm run dev:web
```
