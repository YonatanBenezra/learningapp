# QA runbook — Phase 0 · 1 · 2

Engineering QA for everything shipped through Phase 2. Use this before dogfood invites, release branches, or sign-off reviews.

**Related:** [phase-0.md](./phase-0.md) Step 13 · [phase-1-signoff.md](./phase-1-signoff.md) · [phase-2-signoff.md](./phase-2-signoff.md)

---

## Quick start (~15 min automated)

```bash
# From repo root
cp apps/api/.env.example apps/api/.env    # if missing
cp apps/web/.env.example apps/web/.env.local

docker compose up -d
docker compose up -d sandbox-gateway      # agent + sandbox RAG

npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed

# Gates (run from repo root)
npm run content:validate
npm test -- src/content/content-pipeline.spec.ts -w @labpath/api
npm run test:e2e -w @labpath/api
npm run typecheck
```

| Gate | Pass criteria |
|---|---|
| `content:validate` | **154** exercises checked, **0 failed** (150 published + 4 unpublished `ctst-*`) |
| `content-pipeline.spec.ts` | Every published exercise: reference **pass**, near-miss **fail**, no canary in JSON |
| `test:e2e` | **76/76** tests (sets `SANDBOX_ALLOW_RUNC_FALLBACK=true` automatically) |
| `typecheck` | API + web clean |

Optional (needs Docker + gateway):

```bash
SANDBOX_INTEGRATION=1 SANDBOX_ALLOW_RUNC_FALLBACK=true npm run sandbox:smoke -w @labpath/api
```

---

## Local stack for manual QA

Three processes:

```bash
npm run dev:api      # http://localhost:3001
npm run dev:worker
npm run dev:web      # http://localhost:3000
```

| Check | Command / URL |
|---|---|
| Liveness | `GET http://localhost:3001/api/health` |
| Readiness | `GET http://localhost:3001/api/health/ready` (Postgres + Redis) |
| Catalogue count | `GET /api/exercises?pageSize=200` → **150** items, no duplicate slugs |
| Cost probe | `GET /api/internal/cost` (authenticated) |
| Budget kill | `POST /api/internal/cost/over-budget` |

**Pro user:** magic-link sign-in, then Stripe test checkout at `/billing`, or set tier in DB for dogfood.

---

## Phase map — what each phase added

| Phase | Catalogue | Simulators | Product surface |
|---|---|---|---|
| **0** Inner POC | 10 | RAG (R1–R4), Eval (E1–E3), Guardrails (G1–G3) | Auth, catalogue, workspace, submit → grade → trace |
| **1** Public beta | 50 | + Prompt Engineering (P1+) | Stripe Pro, tiers, onboarding, streaks, public profile |
| **2** Depth | 150 | + Agent (A1–A5+), Benchmark (B1–B3+) | Paths, contests, leaderboard, contest rating |

Regression QA for Phase 2 **must** still cover Phase 0–1 flows (auth, R1, billing, tiers).

---

## Automated tests → phase coverage

| E2E suite | Phase | Covers |
|---|---|---|
| `app.e2e-spec.ts` | 0 | Health |
| `auth.e2e-spec.ts` | 0 | Magic link, cookies, refresh |
| `practice.e2e-spec.ts` | 0 | Attempt → submit → grade loop |
| `r1-grade.e2e-spec.ts` | 0 | R1 reference pass / near-miss fail |
| `r1-screens.e2e-spec.ts` | 0 | R1 UI surfaces |
| `eval-grade.e2e-spec.ts` | 0 | E1–E3 |
| `guardrails-grade.e2e-spec.ts` | 0 | G1–G3 |
| `rag-grade.e2e-spec.ts` | 0 | R2–R4 |
| `cost.e2e-spec.ts` | 0 | Gateway budget / `killed_budget` |
| `pe-grade.e2e-spec.ts` | 1 | P1 prompt engineering |
| `accounts.e2e-spec.ts` | 1 | Free / Pro tier fields |
| `billing.e2e-spec.ts` | 1 | Stripe checkout lifecycle |
| `tier-enforcement.e2e-spec.ts` | 1 | Free submission cap → 429 |
| `onboarding.e2e-spec.ts` | 1 | First-submit event |
| `engagement.e2e-spec.ts` | 1 | Streaks / daily drill |
| `profiles.e2e-spec.ts` | 1 | Public profile opt-in |
| `catalogue.e2e-spec.ts` | 1–2 | List size, no `HIDDEN_EVAL` |
| `agent-grade.e2e-spec.ts` | 2 | A1–A5 pass/fail + traces |
| `bench-grade.e2e-spec.ts` | 2 | B1–B3 variance slice |
| `paths.e2e-spec.ts` | 2 | Guided path start + continue |
| `contests.e2e-spec.ts` | 2 | Enter, sample, hints off |
| `leaderboard.e2e-spec.ts` | 2 | Team-free ranking |

Run a subset:

```bash
npm run test:e2e -w @labpath/api -- --testPathPatterns="agent-grade|contests"
```

---

## Manual QA — Phase 0 (inner POC)

Source: [phase-0.md](./phase-0.md) Step 13.

### Done-when checklist

- [ ] All **10** exercises listed and gradable
- [ ] Each: reference **pass**, near-miss **fail** (covered by `content-pipeline.spec.ts`)
- [ ] Re-submit same R1 payload → same verdict (deterministic harness)
- [ ] Hidden fixtures never in API / grade / trace JSON
- [ ] Budget kill works on a gateway exercise (`killed_budget`)
- [ ] Teammate finishes ≥ 1 exercise **per simulator** in UI

### Spot-check slugs (one per simulator)

| Simulator | Slug |
|---|---|
| RAG | `rag-001-chunk-it-right` |
| Eval | `eval-001-write-the-assertion-suite` |
| Guardrails | `grd-001-break-the-concierge` |

### Per-exercise UI pass (~5 min each)

1. Open `/exercises/<slug>`
2. Start attempt → submit reference-ish config
3. Poll run → **succeeded**
4. Scorecard: verdict + failure classes (on intentional fail)
5. Trace: instrumentation visible; **no** `HIDDEN_EVAL` / `eval_hidden`

---

## Manual QA — Phase 1 (public beta)

Source: [phase-1-signoff.md](./phase-1-signoff.md).

### CI parity

- [ ] `content:validate` on 50+ exercises
- [ ] `content-pipeline.spec.ts` green
- [ ] Catalogue e2e: **50** published, no canary leak

### Teammate walkthrough (~20 min)

1. [ ] Magic-link sign-in → `/onboarding` (R1 starter, ~3 min)
2. [ ] Submit → scorecard visible
3. [ ] `/billing` → Pro checkout (Stripe test) or existing Pro
4. [ ] `/progress` → today's drill + streak after solve
5. [ ] Opt in to `/u/:slug` public profile (Pro)

### Tier & billing

- [ ] **Free:** 4th submission within window → **429**
- [ ] **Pro:** cap lifted (60 attempts / 30d fair-use messaging if hit)
- [ ] Stripe webhook: subscription active reflects in `/me`

### Prompt Engineering

- [ ] `/catalogue` filter PE → open P1 → submit → pass + trace
- [ ] Near-miss config → fail with named failure class

### Security (Phase 0 carry-forward)

- [ ] `GET /api/exercises/:slug` — no hidden eval, no corpus secrets
- [ ] Grade + trace JSON — grep mentally for `HIDDEN_EVAL`

---

## Manual QA — Phase 2 (depth & competition)

Source: [phase-2-signoff.md](./phase-2-signoff.md).

### Catalogue mix (150 published)

| Band | Target |
|---|---|
| RAG | 25 |
| Prompt Engineering | 20 |
| Evaluation | 30 |
| Guardrails | 30 |
| Agent & Tool Use | 25 |
| Benchmark Playground | 20 |

- [ ] `GET /api/exercises?pageSize=200` → **150** items
- [ ] Latest version per slug only (no duplicate slugs)
- [ ] `ctst-*` (4) **not** in public catalogue

### Teammate walkthrough (~30 min)

1. [ ] `/catalogue` → filter **Agent** → **A1** (`agt-001-call-the-right-tool`) → submit → scorecard + **tool trace** (calculator step)
2. [ ] Filter **Benchmark** → **B1** → pass with variance knobs (`noise`, `ci_overlap`)
3. [ ] `/paths` → **RAG fundamentals** or **Guardrails red-team** → start + continue next unsolved step
4. [ ] `/contests` → **Dogfood Season 1** → **Enter** (Pro) → sampled problems → scorecard
5. [ ] `/leaderboard` — contest scores after window closes (or seeded dogfood data)
6. [ ] `/u/:slug` — `contestRating` when finished contest entry exists

### Contests & access control

- [ ] **Pro:** enter contest, hints **off** on contest attempts
- [ ] **Free:** upgrade CTA; enter blocked
- [ ] Contest scorecard — no hidden eval leak

### Agent / sandbox infra

- [ ] `docker compose ps` → `sandbox-gateway` running
- [ ] Agent grade response has no `sandboxError: sandbox_runtime_unavailable`
- [ ] If e2e agent tests fail locally: ensure `SANDBOX_ALLOW_RUNC_FALLBACK=true` **before** Node starts (already in `test:e2e` script)

---

## Cross-phase regression matrix

Run after any change to grading, catalogue, or auth.

| Area | Smoke test |
|---|---|
| Auth | Sign in → `/me` returns user |
| Core loop | R1 submit → grade pass |
| PE | P1 submit → grade pass |
| Agent | A1 submit → pass + trace |
| Benchmark | B1 submit → pass |
| Tiers | Free 429 on over-cap submit |
| Contests | Pro enter → attempt created |
| Leakage | No `HIDDEN_EVAL` in network tab on grade/trace |

---

## Sign-off template

Copy into PR, release ticket, or dogfood invite.

```markdown
## QA sign-off — Labpath Phase 0–2

**Date:** YYYY-MM-DD
**Tester:** @handle
**Commit / branch:** 

### Automated
- [ ] npm run content:validate — 154/154 OK
- [ ] content-pipeline.spec.ts — 150 ref pass / near-miss fail
- [ ] test:e2e — 76/76 pass
- [ ] typecheck — API + web

### Phase 0
- [ ] 10 exercises gradable in UI (3 simulators spot-checked)
- [ ] No hidden eval leak
- [ ] Budget kill probe OK

### Phase 1
- [ ] Onboarding + progress + streak
- [ ] Free 429 / Pro upgrade
- [ ] Public profile opt-in
- [ ] P1 grades

### Phase 2
- [ ] Catalogue 150, mix OK, no ctst-* public
- [ ] A1 trace + B1 benchmark
- [ ] Guided path navigation
- [ ] Contest enter (Pro), hints off
- [ ] Leaderboard + contestRating on profile

### Issues
- (none / list with severity)

### Verdict
- [ ] Ready for dogfood
- [ ] Blocked
```

---

## Out of scope (not bugs)

Do not fail QA for these — they are deferred by sign-off:

| Gap | Doc |
|---|---|
| 1,000 signups, D7 > 25%, activation dashboards | phase-1-signoff |
| Live blended cost on production traffic | phase-1-signoff, phase-2-signoff |
| 20 external testers, judge κ ≥ 0.70, 99% re-grade stability | phase-0 Step 13, phase-1-signoff |
| Firecracker microVM | phase-2-decisions |
| Contest paste telemetry | phase-2-decisions |
| Neural Network / Fine-tuning, verified assessments | Phase 3 |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Agent reference fails e2e | Sandbox runtime not available | `SANDBOX_ALLOW_RUNC_FALLBACK=true` at process start; `docker compose up -d sandbox-gateway` |
| Run stuck `queued` | Worker not running | Start `npm run dev:worker` |
| Run `failed` enqueue | Redis down | `docker compose up -d`; check `:6382` |
| Catalogue missing exercises | Stale DB | `npm run prisma:seed` |
| Grade 404 | Run not finished | Poll `/api/runs/:id` until `succeeded` |
| Stripe checkout fails | Missing test keys in `.env` | Use Stripe test mode keys or skip billing QA |

---

## Suggested QA cadence

| When | What |
|---|---|
| Every PR touching API/content | `content:validate` + affected e2e subset |
| Pre-merge to main | Full `test:e2e` + `typecheck` |
| Pre-dogfood / release | Full automated gates + Phase 2 walkthrough + sign-off template |

**Time budget:** ~15 min automated only · ~90 min full manual + automated.
