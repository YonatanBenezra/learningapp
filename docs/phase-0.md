# Phase 0 — Inner POC

How we build Phase 0. One step at a time. Do not skip ahead. Do not start Phase 1 from this file.

Roadmap of all phases: [phase.md](./phase.md). Product rules: [LabPath-Specification.md](./Labpath%20specification/LabPath-Specification.md) Part 2.

**Kind:** internal POC, not production. No public launch, Stripe, sandbox, or redesign.

**Goal:** a learner can open the catalogue, solve graded exercises, and see a scorecard. First proof is **R1**. Then the other nine.

**Now:** Step 12 `done`. Next is Step 13 — Inner POC sign-off. Do not start it until you are ready.

| Status | Meaning |
|---|---|
| `todo` | Not started |
| `doing` | Current step — only one at a time |
| `done` | Accepted; do not reopen unless broken |

---

## Rules

- Finish a step’s **Done when** before starting the next.
- Build only what the current step names. No extra simulators, no landing page, no payments.
- R1 is the go/no-go. If R1 does not grade, do not seed the other nine.
- Hidden eval sets never appear in API responses, traces, or errors.
- Verdicts are `pass | fail | inconclusive`. Money is EUR micros.
- Learner input in Phase 0: JSON config, prompts, Assertion DSL, Slice Spec. No arbitrary code.

## Out of this phase

Code sandbox, Stripe, contests, streaks, public profiles, tutors, courses, i18n, Prompt Engineering / Agent / Benchmark / NN / Fine-tune simulators, marketing landing.

---

## Step list

| Step | Name | Status | Unlocks |
|---|---|---|---|
| 1 | Infra live | `done` | DB + Redis that the API actually uses |
| 2 | Thin auth | `done` | A user who can own attempts |
| 3 | Catalogue + R1 seed | `done` | Something to open in the UI |
| 4 | Attempt → submit → run | `done` | The practice loop, grade still empty |
| 5 | Worker queue | `done` | Jobs leave HTTP and run in the worker |
| 6 | R1 grade (go/no-go) | `done` | First real exercise |
| 7 | Workspace UI for R1 | `done` | Submit and see a scorecard in the browser |
| 8 | Trace, hints, progress | `done` | The four Phase 0 screens |
| 9 | Model gateway + budgets | `done` | Live generation without unbounded cost |
| 10 | RAG: R2, R3, R4 | `done` | Four RAG exercises |
| 11 | Eval: E1, E2, E3 | `done` | Assertion DSL + Slice Spec |
| 12 | Guardrails: G1, G2, G3 | `done` | Ten exercises playable |
| 13 | Inner POC sign-off | `todo` | Phase 0 closed |

---

## Step 1 — Infra live

**Status:** `done`

**Why first:** nothing else is real until Postgres and Redis are used, not just composed.

**Do**

- `docker compose up -d` (Postgres + pgvector on **:5434**, Redis on **:6382** — host 5432/6379 were already taken)
- Apply Prisma migration (`prisma migrate deploy`)
- `PrismaService` connects on boot; fail ready-check if DB is down
- Redis client actually connects (no `NotImplementedException`)
- `GET /api/health` stays liveness; `GET /api/health/ready` checks DB (+ Redis)

**Done when**

- [x] Migration is on a local DB
- [x] `/api/health/ready` returns ok only if Postgres is up (503 + `postgres: down` when the container is stopped)
- [x] API restart survives without throwing on missing `$connect`

**Do not:** auth, seed data, grading.

---

## Step 2 — Thin auth

**Status:** `done`

**Why:** attempts must belong to a user. Inner POC: magic link is enough. OAuth later.

**Do**

- `POST` request-magic-link (dev: log or return the token, no email provider required)
- Consume magic link → JWT access + rotating refresh cookies
- `GET /api/me`
- Logout + refresh
- JwtAuthGuard on non-public routes; health stays public

**Done when**

- [x] A local request can sign in and hit `/api/me`
- [x] Guarded routes return 401 without a cookie

**Do not:** Google/GitHub, roles UI, account deletion, email vendor.

---

## Step 3 — Catalogue + R1 seed

**Status:** `done`

**Why:** the vertical slice needs one published exercise before submit exists.

**Do**

- `GET /api/exercises` (filter later if cheap)
- `GET /api/exercises/:slug` — brief, public schema, budgets; **no hidden set**
- Seed **R1 · Chunk It Right** (`rag`, `E`): public brief + public sample + hidden set stored in `harness` schema (or object path), never selected by the API role
- Web catalogue page lists R1 from the API

**Done when**

- [x] Authenticated `GET /api/exercises` returns R1
- [x] Slug payload has no hidden Q/A (`HIDDEN_EVAL_R1_CANARY_PHRASE` never in API JSON)
- [x] Catalogue page shows R1 (can be ugly)

**Do not:** the other nine exercises, ingest Action, workspace submit.

---

## Step 4 — Attempt → submit → run

**Status:** `done`

**Why:** persist the loop before any harness exists.

**Do**

- `POST /api/attempts` for a published exercise
- `POST /api/attempts/:id/submissions` — validate payload against R1 JSON schema
- Create `runs` row `queued`
- `GET /api/runs/:id` — status only
- `GET /api/runs/:id/grade` — 404 / pending until Step 6

**Done when**

- [x] One authenticated user can start R1, submit a chunking config, and poll a run id
- [x] Invalid payload is 400

**Do not:** call models, compute recall, SSE.

---

## Step 5 — Worker queue

**Status:** `done`

**Why:** HTTP must not grade inline. Spec: API process + worker process.

**Do**

- Wire BullMQ (`grade` queue)
- Submit enqueues a job; worker picks it up
- Run status: `queued` → `running` → `succeeded` or `failed`
- Worker uses `DATABASE_URL_WORKER` if already in env; do not invent a second role until it blocks

**Done when**

- [x] `npm run dev:api` + `npm run dev:worker` process a submission
- [x] Run leaves `queued` without a grade yet (noop processor is OK) — status becomes `succeeded`, `GET .../grade` is still 404

**Do not:** RAG metrics, model gateway.

---

## Step 6 — R1 grade (go/no-go)

**Status:** `done`

**Why:** this is the Phase 0 proof. Stop here if it is not stable.

**Do**

- RAG harness: apply learner chunk size / overlap / split strategy on the R1 corpus
- Class A only: `recall@5` on the hidden set; pass if ≥ 0.80
- Write `grades` (verdict, metrics, failure classes, scorecard)
- Near-miss config fails; reference config passes
- Re-grade the same payload → same pass/fail (cache later; freeze retrieval for now)

**Done when**

- [x] `GET /api/runs/:id/grade` returns pass or fail for R1
- [x] Reference solution passes in a test
- [x] Near-miss fails in a test
- [x] Hidden questions are not in the grade payload except allowed failing-sample rules (rotate later)

**If this step fails:** do not start Steps 10–12. Fix R1.

**Do not:** R2–R4, judges, live generation (R1 is retrieval-only).

---

## Step 7 — Workspace UI for R1

**Status:** `done`

**Why:** inner POC is not real until a person can click it.

**Do**

- `/exercises/rag-001-chunk-it-right`: brief, chunking form, run, scorecard
- Login → catalogue → workspace → submit → see verdict
- Reuse current shell. No visual redesign.

**Done when**

- [x] A teammate can pass or fail R1 in the browser without curl

**Do not:** G1 live chat UI, assertion editor, landing page.

---

## Step 8 — Trace, hints, progress

**Status:** `done`

**Do**

- `GET /api/runs/:id/trace` — retrieved chunks, scores, tokens/cost if any; no gold labels
- `POST /api/exercises/:slug/hints/next` — progressive hints
- `GET /api/me/progress` — attempts, solves
- Wire `/runs/:id`, `/runs/:id/trace`, `/progress`

**Done when**

- [x] The four Phase 0 screens work for R1

**Do not:** public profiles, skill-radar polish, share links.

---

## Step 9 — Model gateway + budgets

**Status:** `done`

**Why:** R2/R3/R4 and G1–G3 need metered model calls. Build crude now.

**Do**

- Single gateway for every provider call: pin model, count tokens, EUR micros, hard cutoff
- `gen_cache` / `judge_cache` keys as in Prisma
- Kill run with `killed_budget` when over exercise budget
- Internal cost readout (endpoint or log). Dashboard UI can stay ugly

**Done when**

- [x] A fake over-budget job is killed and reported
- [x] No harness calls a provider SDK directly

**Do not:** multi-provider failover, production keys in git.

---

## Step 10 — RAG: R2, R3, R4

**Status:** `done`

**Do only after Step 6 is done.**

**Do**

- Seed + grade R2 (cost ceiling), R3 (citation contract — flagship), R4 (rerank)
- Class A gates first. Class B judges stubbed/advisory
- Shared synthetic internal-policy corpus (O4)

**Done when**

- [x] Four RAG exercises are playable internally with class A pass/fail
- [x] R2 reference `{ topK: 5, rerank: true, chunkSize: 400 }` passes; near-miss k=20 fails on cost
- [x] R3 reference citation+refusal prompt passes; "Answer helpfully." fails
- [x] R4 title-boost nDCG@5 improvement ≥ 0.15; `reranker: none` fails
- [x] Hidden canaries never appear in grade or trace JSON

**Do not:** Eval E1–E3, live provider SDKs, class B as a pass/fail gate.

---

## Step 11 — Eval: E1, E2, E3

**Status:** `done`

**Do only after Step 10 is done.**

**Do**

- Freeze Assertion DSL grammar (RE2-lite) before E1
- Frozen generation fixtures — no live gen to score eval
- E1 assertion suite, E2 learner-judge (class A on judge behaviour), E3 Slice Spec (do not merge into the DSL)
- Degenerate-suite rejection for E1; E3 attempt policy (5 then 24h)

**Done when**

- [x] E1–E3 grade in the worker against hidden labels / paired outputs
- [x] E1 reference suite passes F1/precision/recall; SSN-only near-miss fails; empty suite is `degenerate-suite`
- [x] E2 strict rubric passes κ / self-consistency / traps; generous near-miss fails
- [x] E3 hebrew-billing slice spec passes; `where: true` fails as `aggregate-only`
- [x] Sixth E3 submit in 24h returns 429
- [x] Hidden canaries never appear in grade or trace JSON

**Do not:** Guardrails G1–G3, live provider SDKs, merging Slice Spec into the Assertion DSL.

---

## Step 12 — Guardrails: G1, G2, G3

**Status:** `done`

**Do only after Step 11 is done.**

**Do**

- Shared normaliser + level manifests (`filter_catches ⊂ detector_catches`)
- G1 live mock chat, canary win
- G2 page payload + tool-call log + policy checker
- G3 pool-and-sample (40 attacks / 60 benign), Wilson interval, inconclusive near the line
- Simulations HTTP for G1 turns (`/api/simulations/g1/turns`)

**Done when**

- [x] G1–G3 are playable internally
- [x] Catalogue shows all **10** exercises
- [x] G1 hex jailbreak wins L1–L3; polite ask fails L2/L3
- [x] G2 delimiter breakout + bcc wins; direct attacker `to` fails L3
- [x] G3 reference defence passes Wilson gates; brittle `ignore previous` near-miss fails
- [x] Hidden canaries never appear in grade or trace JSON

**Do not:** Phase 1 sandbox, Stripe, contests, Step 13 sign-off until the team is ready.

---

## Step 13 — Inner POC sign-off

Not the full spec §0.8 public bar. This is what we call Phase 0 done **for the inner POC**.

**Done when**

1. All 10 listed and gradable for the team
2. Each has a reference that passes and a near-miss that fails (tests or recorded runs)
3. Same R1 payload re-grades to the same verdict in a small local harness (not 1,000 trials)
4. Leakage grep: hidden fixtures do not appear in API fixtures/tests
5. Budget kill works on at least one exercise that uses the gateway
6. A teammate can finish ≥ 1 exercise per simulator in the UI

**Later (not this inner POC):** 20 external testers, κ ≥ 0.70, adversarial grader suite as a ship gate, blended €0.20, 99% on 1,000 re-grades.

---

## Exercise checklist (fill during Steps 6 / 10–12)

| ID | Title | Step | Seeded | Grades | UI |
|---|---|---|---|---|---|
| R1 | Chunk It Right | 6–7 | yes | yes | yes |
| R2 | The Cost Ceiling | 10 | yes | yes | yes |
| R3 | The Citation Contract | 10 | yes | yes | yes |
| R4 | Rerank or Re-think | 10 | yes | yes | yes |
| E1 | Write the Assertion Suite | 11 | yes | yes | yes |
| E2 | Judge the Judge | 11 | yes | yes | yes |
| E3 | Catch the Regression | 11 | yes | yes | yes |
| G1 | Break the Concierge | 12 | yes | yes | yes |
| G2 | The Indirect Payload | 12 | yes | yes | yes |
| G3 | Hold the Line | 12 | yes | yes | yes |

---

## Next

Step 12 is `done`. Start **Step 13 — Inner POC sign-off** when ready.

Local infra: `docker compose up -d` → Postgres `:5434`, Redis `:6382`. Seed: `npm run prisma:seed`. API + worker: `npm run dev:api` and `npm run dev:worker`. Web: `npm run dev:web`. Workspaces: `/exercises/rag-001-chunk-it-right`, `/exercises/rag-002-the-cost-ceiling`, `/exercises/rag-003-the-citation-contract`, `/exercises/rag-004-rerank-or-rethink`, `/exercises/eval-001-write-the-assertion-suite`, `/exercises/eval-002-judge-the-judge`, `/exercises/eval-003-catch-the-regression`, `/exercises/grd-001-break-the-concierge`, `/exercises/grd-002-the-indirect-payload`, `/exercises/grd-003-hold-the-line`. Cost: `GET /api/internal/cost`. Budget probe: `POST /api/internal/cost/over-budget`.
