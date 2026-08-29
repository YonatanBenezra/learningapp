# LabPath phases

Source: [LabPath-Specification.md](Labpath%20specification/LabPath-Specification.md) Part 2. Engineering stack: NestJS + Prisma + PostgreSQL (team override of spec §11 Python workers).

Phases 1–5 are scoped here, not fully specified. Re-spec each phase before starting it.

**Now:** Phase 1 Step 7 — Stripe billing. See [phase-1.md](./phase-1.md).

| Status | Meaning |
|---|---|
| Done | Shipped and accepted |
| In progress | Active work |
| Next | Immediate work once implementation starts |
| Blocked | Waiting on an open decision |
| Later | Out of the current phase |

---

## Overview

| Phase | Name | Duration | Exit |
|---|---|---|---|
| **0** | POC — 10 exercises, 3 simulators | 6–8 weeks | All ten criteria in §0.8. Short: stable verdicts, calibrated judges, injection-resistant graders, ≥15 of 20 external testers complete ≥5 exercises and ≥70% rate feedback helpful |
| 1 | Public beta | +10 weeks | 50 exercises, code sandbox, accounts, payments, 1,000 signups |
| 2 | Depth & competition | +12 weeks | Agent + Benchmark simulators live; contests running; 150 exercises |
| 3 | Credibility | +10 weeks | Verified assessments shipped; public profiles used by employers |
| 4 | Tutor marketplace | +12 weeks | 50 vetted tutors; first 500 paid sessions |
| 5 | Teams, institutions, Bina | +12 weeks | First team and first institutional contract |

---

## Phase 0 — POC (inner POC — Step 13 pending)

Working plan (steps, status, inner-POC bar): **[phase-0.md](./phase-0.md)**. Steps 1–12 are done; finish Step 13 before Phase 1 implementation.

**Objective:** prove that a graded, hidden-eval-set AI engineering exercise produces feedback good enough that engineers come back. Not scale, not payments, not breadth.

**Duration:** 6–8 weeks.

### Repo status

| Piece | Status |
|---|---|
| Monorepo (`apps/api`, `apps/web`, `infra/`) | Done — shells |
| Nest modules, Prisma schema, initial migration | Done — applied on local Docker Postgres (:5434) |
| HTTP API + worker process split | Done — health liveness + ready (Postgres + Redis) |
| Next.js routes (catalogue, workspace, trace, progress, auth) | Four Phase 0 screens live for R1 (catalogue, workspace, trace, progress) |
| Magic-link auth, catalogue, attempts, grading | Done through R1 grade, workspace, traces, hints, progress, and metered gateway |
| Prisma migrate on Postgres | Done |
| Redis / BullMQ wiring | Redis connected; BullMQ `grade` queue; worker runs the R1 RAG harness |
| Model gateway, caches, harnesses | Fake pinned gateway + gen/judge cache + `killed_budget`. R2–R4 next |
| 10 authored exercises + hidden sets | Later in this phase |

### In

- 3 harnesses: RAG, LLM Evaluation, Prompt Injection & Guardrails
- 10 exercises with hidden eval sets and reference solutions
- Exercise-as-code repo + CI that runs reference solutions nightly
- Grading engine: class A and class B, budget enforcement, model gateway
- Workspace UI: brief, submission surface, run, scorecard, trace, hints
- Minimal auth (magic link or OAuth), attempt history
- Internal cost dashboard

### Out

- Arbitrary code execution / sandbox
- Payments, tiers, billing
- Contests, leaderboards, streaks, public profiles
- Tutors, courses, guided paths
- Mobile-optimised layouts (responsive-tolerable is enough)
- The other five simulators
- i18n

Role enum (`learner \| tutor \| org_admin \| admin`) and durable traces still ship now so later phases are not a rewrite. Tutor tables, booking, and payouts do not.

### The 10 exercises

Difficulty: **E** easy · **M** medium · **H** hard. Every exercise has at least one class A (deterministic) gate.

| ID | Title | Sim | Band | Skills | Class B? |
|---|---|---|---|---|---|
| **R1** | Chunk It Right | RAG | E | chunking, retrieval-quality | No |
| **R2** | The Cost Ceiling | RAG | E/M | retrieval-quality, cost-engineering | Yes |
| **R3** | The Citation Contract | RAG | M | grounding, prompt-design, refusal-behaviour | Yes — flagship demo |
| **R4** | Rerank or Re-think | RAG | M/H | reranking, retrieval-quality, evaluation-reading | Yes |
| **E1** | Write the Assertion Suite | Eval | E | eval-design, deterministic-checks | No |
| **E2** | Judge the Judge | Eval | M | llm-as-judge, calibration, bias-awareness | No |
| **E3** | Catch the Regression | Eval | M/H | regression-detection, slicing, significance | No |
| **G1** | Break the Concierge | Guardrails | E | prompt-injection, system-prompt-extraction | No |
| **G2** | The Indirect Payload | Guardrails | M | indirect-injection, tool-abuse, agent-security | No |
| **G3** | Hold the Line | Guardrails | M/H | guardrail-design, fp-fn-tradeoff, defensive-prompting | No |

If judge calibration fails, drop class B gates on R2/R3/R4 to advisory. Seven of ten exercises are unaffected.

### UI (four screens)

1. Catalogue
2. Workspace (brief / submission / run)
3. Trace view
4. Progress (attempts, solves, first-cut skill radar)

Reuse the prototype shell. Do not redesign in Phase 0.

### API surface

```
GET    /api/exercises
GET    /api/exercises/:slug
POST   /api/attempts
POST   /api/attempts/:id/submissions
GET    /api/runs/:id
GET    /api/runs/:id/stream
GET    /api/runs/:id/grade
GET    /api/runs/:id/trace
POST   /api/exercises/:slug/hints/next
GET    /api/me/progress
```

Hidden eval sets are never exposed. CI greps responses for hidden-set fixtures.

### Week sequence

Week 2 is go/no-go. If R1 is not end-to-end with ≥ 99% re-grade stability, the schedule is wrong. Week 3 is the scope check: if R3/G3 authoring overruns, cut to 8 exercises (drop R2 and E3). Do not cut the tester round.

| Week | Milestone |
|---|---|
| 0 | Lock **O1** (model provider). Thresholds cannot be tuned without it. Also O4, O7. |
| 1 | Prisma migrate, two DB roles, Nest API + worker live, model gateway + gen_cache, `exercise.yaml` ingest, labelling guidelines |
| 2 | **Go/no-go:** RAG harness + **R1 end-to-end**, ≥ 99% stability, vertical slice through workspace |
| 3 | Workspace + trace against R1. Start authoring R3 and G3 (hardest content first) |
| 4 | R2, R4. Judge service (quarantine + structured verdicts). Double-annotation underway |
| 5 | Eval harness + frozen fixtures. Freeze Assertion DSL grammar. E1, E2 |
| 6 | Guardrail harness, shared normaliser, tool-call log, G1, G2. E3 + Slice Spec |
| 7 | G3 pool-and-sample. Budget kill tests. Leakage tests. Adversarial grader suite. RE2 DoS test |
| 8 | Threshold tune, 20 external testers, feedback iteration, acceptance sign-off |

### Acceptance (all required)

Criteria 2, 3, 4, and 9 are the real gates. The rest are hygiene.

1. All 10 published; each has a passing reference solution **and** a near-miss that reliably fails
2. **Verdict stability:** same payload re-grades to the same pass/fail in ≥ 99% of 100 trials per exercise. Inconclusive < 5%
3. **Judge calibration:** every gating class B judge holds κ ≥ 0.70 vs double-annotated labels; human–human κ reported alongside
4. **Grader integrity:** adversarial suite passes — no known injection flips a verdict
5. **No leakage:** hidden items never appear in API, trace, or errors
6. **Budget enforcement:** over-budget attempts killed; RE2 timeouts verified
7. **Performance:** grade < 60 s p95
8. **Cost:** within per-exercise budgets; blended mean ≤ €0.20; cost dashboard live
9. **External validation:** ≥ 20 testers; ≥ 15 complete ≥ 5 exercises; ≥ 70% rate failure feedback helpful
10. **Failure taxonomy:** unclassified rate < 10%

### Week-1 blockers (must exist before R1)

- Assertion DSL (E1, G3) — RE2 only; grammar frozen before week 5
- Slice Spec (E3 only) — separate format; do not unify with the DSL in Phase 0
- Human labelling protocol — ~1,000 double-annotated items; second annotator is not the author
- `exercise.yaml` ingest — signed admin endpoint; hidden files never land in the API-readable schema

---

## Phase 1 — Public beta (+10 weeks)

Working plan (steps, status): **[phase-1.md](./phase-1.md)**. Implement one step at a time, starting at Step 1.

**Exit:** 1,000 signups, activation > 40%, D7 > 25%, gross margin positive on Pro.

- Code execution sandbox (gVisor / Firecracker) — dedicated workstream + security review
- Prompt Engineering simulator
- Catalogue to **50** exercises (~40% RAG/Prompt, 30% Eval, 30% Guardrails)
- Accounts, Free/Pro, Stripe, quotas
- Streaks, daily drills, solve history, first public profile
- Onboarding: 3-minute first-solve path

**Must close O8 before paid tiers launch.** Blended ~€0.16/attempt × 150 attempts/mo ≈ €24 vs €19 Pro and a €4.75 cost target.

---

## Phase 2 — Depth & competition (+12 weeks)

**Exit:** Agent and Benchmark simulators live; contests running; 150 exercises.

- Agent & Tool Use simulator (own mini-project: real tools in sandbox, multi-step traces, loop/cost ceilings)
- Benchmark Playground
- Contests — timed, novel, ranked, seasonal
- Guided paths (ordered sequences, still no lessons)
- Team-free leaderboards
- Catalogue to **150** exercises

---

## Phase 3 — Credibility (+10 weeks)

**Exit:** verified assessments shipped; public profiles used by employers.

- Verified assessments: proctored, novel, time-boxed, no hints, LabPath-signed result
- Employer-facing profile + shareable verified skill report
- Neural Network simulator and Fine-tuning simulator
- Skill decay, recency weighting, mature skill graph
- Hiring-team conversations so the score becomes a signal

Full tutor-marketplace spec is written at Phase 3 exit.

---

## Phase 4 — Tutor marketplace (+12 weeks)

**Exit:** 50 vetted tutors; first 500 paid sessions.

- Tutor onboarding; vetting by exercise solve, not CV
- Contextual booking from a failed exercise (submission + trace into the session)
- In-platform session workspace
- Scheduling, calendar, timezones
- Escrow, payouts, refunds, disputes, 20–25% take rate
- Reviews and ranking; supply/demand by skill node

Supply is the hard part. Recruit the first 50 tutors from top-ranked users **before** this phase opens. Build nothing marketplace-related until then except: role enum, durable traces, skill graph.

---

## Phase 5 — Teams, institutions, Bina (+12 weeks)

**Exit:** first team and first institutional contract.

- Org accounts, SSO/SCIM, seats, team skill-gap dashboards, custom sets
- LTI / LMS for universities
- Cohort management, instructor view, assignment and grading export
- Bina convergence: LabPath grading substrate as the AI-engineering layer inside Bina (integration, not a rewrite — exercise-as-code, grading API, and skill graph are designed for this in Phase 0)
- Private-cloud / on-prem for government and defence

---

## Open decisions

| ID | Decision | When | Working position |
|---|---|---|---|
| O1 | Model provider — single vs multi | **Before Phase 0 week 1** | Single provider for graders/judges; learner-selectable for the system under test where relevant |
| O2 | Brand — LabPath vs Bina | Phase 1 Step 1 | **Locked:** LabPath; “by Bina” endorsement — [phase-1-decisions.md](./phase-1-decisions.md) |
| O3 | Free tier — 3 problems/month vs 3/week | Phase 1 Step 1 | **Locked:** 3 exercises/week (UTC) |
| O4 | Own corpora vs licence docs | Phase 0 week 1 | Author synthetic corpora |
| O5 | LabPath-issued vs partner-accredited assessments | Phase 3 | LabPath-issued first |
| O6 | Tutor geography and payment rails | Phase 4 | — |
| O7 | Verify competitor-scoring claim first-hand | Phase 0 week 1 | One hour of hands-on testing, recorded |
| O8 | Unit-economics gap (~€24 compute vs €19 Pro) | Phase 1 Step 7 (Stripe) | **Locked:** €24/mo Pro, 60 attempts/mo fair-use, ≤€0.10 blend — [phase-1-decisions.md](./phase-1-decisions.md) |

---

## Simulator map

| Simulator | Phase |
|---|---|
| RAG | 0 |
| LLM Evaluation | 0 |
| Prompt Injection & Guardrails | 0 |
| Prompt Engineering | 1 |
| Agent & Tool Use | 2 |
| Benchmark Playground | 2 |
| Neural Network | 3 |
| Fine-tuning | 3 |
