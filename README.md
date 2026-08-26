# LabPath

Practice platform for AI engineering.

## Layout

```
apps/api     NestJS API + worker
apps/web     Next.js App Router
infra/       local Postgres (pgvector) on :5434 + Redis on :6382
```

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:seed
npm run dev:api
npm run dev:worker
npm run dev:web
```
