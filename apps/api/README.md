# @labpath/api

NestJS HTTP API and grading worker.

```
src/
  main.ts              HTTP process
  worker.ts            worker process
  core/                config, prisma, redis, queue, logger, health
  common/              shared constants, guards, filters, pipes
  modules/
    identity/          auth, users
    catalogue/         exercises, skills
    practice/          attempts, submissions, runs, grades, traces, hints
    progress/
    ingest/
    cost/
    grading/           harnesses, gateway, dsl, metrics (worker only)
```

```bash
cp .env.example .env
npm run start:dev
npm run start:worker:dev
```

Authenticated `GET /api/internal/cost` is the ugly cost readout. `POST /api/internal/cost/over-budget` kills a probe run (`killed_budget`). Harnesses must call `ModelGateway` — never a provider SDK.
