# Phase 1 — Public beta

How we build Phase 1. One step at a time. Do not skip ahead. Do not start Phase 2 from this file.

Roadmap of all phases: [phase.md](./phase.md). Product rules: [LabPath-Specification.md](./Labpath%20specification/LabPath-Specification.md) Part 2.

**Kind:** public beta — real accounts, payments, growth metrics. Not contests, verified assessments, or tutor marketplace.

**Goal:** strangers can sign up, solve exercises (including Prompt Engineering content), pay for Pro, and come back. Exit: **1,000 signups**, activation **> 40%**, D7 **> 25%**, **gross margin positive on Pro**.

**Duration:** ~10 weeks (per spec).

**Now:** Step 10 `todo`. Step 9 complete — 3-minute first-solve onboarding.

| Status | Meaning |
|---|---|
| `todo` | Not started |
| `doing` | Current step — only one at a time |
| `done` | Accepted; do not reopen unless broken |

---

## Rules

- Finish a step’s **Done when** before starting the next.
- **Close O8 before paid tiers launch.** Do not ship Stripe on current unit-economics numbers.
- Hidden eval sets never appear in API responses, traces, or errors (carry forward from Phase 0).
- Code sandbox is a **dedicated workstream + security review**, not a single ticket.
- Reuse the Phase 0 workspace shell. Visual polish is optional and separate from these steps.
- Build only what the current step names.

## In (Phase 1)

- Code execution sandbox (gVisor / Firecracker): 512 MB, 30 s, no persistent FS, network only via allowlisted model gateway
- **Prompt Engineering** simulator (#4) + harness
- Catalogue **10 → 50** exercises (~40% RAG+Prompt, 30% Eval, 30% Guardrails)
- Accounts, **Free / Pro** tiers, **Stripe**, per-user quotas and fair-use
- Streaks, daily drills, solve history
- First **public profile** (shareable)
- Onboarding: **3-minute first-solve** path

## Out (defer to later phases)

- Agent & Tool Use, Benchmark Playground (Phase 2)
- Contests, leaderboards (Phase 2)
- Verified assessments, employer credential (Phase 3)
- Tutor marketplace (Phase 4)
- Teams, SSO/SCIM, LTI (Phase 5)
- Pro+ / Career tier, i18n, mobile polish, marketing landing redesign

---

## Step list

| Step | Name | Status | Unlocks |
|---|---|---|---|
| 1 | Kickoff & pricing decisions | `done` | O2, O3, O8 locked; Phase 1 scope frozen |
| 2 | Prompt Engineering harness + P1 | `done` | Fourth simulator; first PE exercise grades |
| 3 | Content pipeline at scale | `done` | Authoring → ingest → nightly CI for many exercises |
| 4 | Sandbox foundation | `done` | Hardened Python runtime (security-reviewed) |
| 5 | Sandbox in grading pipeline | `done` | BYOC exercises can execute in worker |
| 6 | Accounts & tier model | `done` | Free/Pro in DB; quota + fair-use fields |
| 7 | Stripe billing | `done` | Checkout, webhooks, subscription lifecycle |
| 8 | Tier enforcement | `done` | Quotas, trace gating, fair-use kill messages |
| 9 | Onboarding | `done` | 3-minute first-solve for new signups |
| 10 | Engagement | `todo` | Streaks, daily drill, solve history |
| 11 | Public profile v1 | `todo` | Shareable profile with solves + radar |
| 12 | Catalogue to 50 + sign-off | `todo` | Phase 1 exit metrics met |

---

## Step 1 — Kickoff & pricing decisions

**Status:** `done`

**Why first:** Phase 1 ships money and growth. Wrong pricing or unresolved O8 blocks Step 7.

**Do**

- Lock **O2** (brand: LabPath + “by Bina” endorsement)
- Lock **O3** (free tier: start generous — **3/week** per phase.md recommendation)
- Close **O8** (unit economics): pick combination of cheaper judge tier, fair-use cap (e.g. 60–80 attempts/mo), higher Pro price, and/or cache sharing — document chosen numbers
- Confirm sandbox approach (gVisor vs Firecracker) and security review owner
- Update [phase.md](./phase.md) “Now” pointer to this file

**Done when**

- [x] Written decision record for O2, O3, O8 (even if “working position” in phase.md)
- [x] Pro price, fair-use cap, and target compute cost/user/month agreed
- [x] Team agrees Step 2 is next (PE before or parallel sandbox — PE does not require sandbox)

**Record:** [phase-1-decisions.md](./phase-1-decisions.md)

**Do not:** Stripe integration, sandbox build, content binge before harness exists.

---

## Step 2 — Prompt Engineering harness + P1

**Status:** `done`

**Why:** Cheapest new simulator; high-volume content; same harness shape as Phase 0 (prompt/config → hidden set → metrics).

**Do**

- Add `prompt-engineering` simulator module + harness folder (mirror RAG/Eval/Guardrails layout)
- Define submission schema (prompts, few-shot blocks, structured-output constraints — no arbitrary code yet)
- Seed **P1** (first PE exercise) with public + hidden eval sets
- Grade pass/fail + scorecard in worker; leakage grep still passes

**Done when**

- [x] P1 playable end-to-end via HTTP (attempt → submit → grade)
- [x] Reference passes; near-miss fails in tests
- [x] Hidden canaries never in grade/trace/API JSON
- [x] Catalogue lists P1 under Prompt Engineering

**Shipped:** `pe-001-the-json-contract` · harness `prompt-engineering/` · tests `p1.grade.spec.ts`, `pe-grade.e2e-spec.ts`

**Do not:** 50 exercises yet; sandbox; Stripe.

---

## Step 3 — Content pipeline at scale

**Status:** `done`

**Why:** 10 → 50 exercises needs repeatable ingest, not one-off seeds.

**Do**

- Harden exercise-as-code CI: validate `meta.json`, run reference + near-miss, signed admin ingest
- Authoring templates per simulator (RAG, Prompt, Eval, Guardrails)
- Track progress toward **50** with target mix: **~20 RAG+Prompt**, **~15 Eval**, **~15 Guardrails**
- Version bumps on content change; historical grades keep `exercise_version`

**Done when**

- [x] CI on merge to `main` runs reference solutions for all published exercises (`npm run content:validate` + `content-pipeline.spec.ts`)
- [x] At least **15 net-new** exercises ingested beyond Phase 0’s 10 (**25** total: 8 RAG, 5 PE, 7 Eval, 5 Guardrails)
- [x] Each new exercise has reference pass + near-miss fail

**Shipped:** `apps/api/scripts/content/*`, `content:validate` in CI, templates under `content/templates/`, `ingest-local.mjs` + HMAC ingest guard, `generate-step3-exercises.mjs`.

**Do not:** Paid tiers; public launch marketing.

---

## Step 4 — Sandbox foundation

**Status:** `done`

**Why:** Spec §12.2 — Phase 1+ arbitrary Python; dedicated workstream with security review.

**Do**

- Stand up sandbox runtime (gVisor or Firecracker microVM)
- Enforce: **512 MB RAM**, **30 s** wall clock, **no persistent FS**, **no network** except allowlisted model gateway
- Security review checklist (escape, egress, resource exhaustion)
- Local/dev harness to run a trivial `print("ok")` job

**Done when**

- [x] Security review signed off (checklist at `docs/sandbox-security-checklist.md`; automated egress/timeout tests pass)
- [x] Sandbox kills runaway jobs with clear error codes (`sandbox_timeout`, `sandbox_oom`, …)
- [x] No outbound network except gateway endpoint in tests (`npm run sandbox:smoke`)

**Shipped:** `infra/sandbox/`, isolated `labpath_sandbox` network + `sandbox-gateway` in compose, `apps/api/src/modules/sandbox/`, `npm run sandbox:smoke`.

**Do not:** Wire every simulator to sandbox yet; production multi-tenant hardening can follow in Step 5.

---

## Step 5 — Sandbox in grading pipeline

**Status:** `done`

**Why:** Unlocks bring-your-own-code exercises across simulators.

**Do**

- Worker job type: materialise submission → sandbox execute → collect stdout/artifacts
- Budget enforcer applies to sandbox time + gateway tokens
- At least one exercise (new or existing) requires Python submission path
- Trace shows sandbox metrics (duration, memory peak) without leaking hidden data

**Done when**

- [x] One sandbox-backed exercise grades end-to-end (`rag-009-python-retriever`)
- [x] Over-time and over-memory attempts fail safely (`sandbox_timeout` / `sandbox_oom` verdicts)
- [x] Grader integrity: learner code cannot read hidden eval files or env secrets

**Shipped:** `SandboxModule` in the worker, `SandboxHarness` + `gradeSandboxRetriever`, `BudgetEnforcer.recordSandbox`, workspace `input.json` (questions + corpus only), trace `sandbox.{durationMs,memoryPeakMb}`.

**Do not:** Agent simulator (Phase 2); arbitrary network.

---

## Step 6 — Accounts & tier model

**Status:** `done`

**Why:** Billing and quotas need a data model before Stripe.

**Do**

- Extend user/account schema: `tier` (free | pro), subscription status, quota counters
- Fair-use fields: attempts this period, daily run count
- Migration + admin readout of tier state

**Done when**

- [x] Every authenticated user has a tier (default free)
- [x] Quota counters increment on submission/run
- [x] Internal endpoint or dashboard shows tier + usage per user

**Shipped:** `accounts` table, `AccountService` period reset (UTC week / rolling 30d), increment on submit, `GET /api/me` includes usage, `GET /api/internal/accounts` (admin).

**Do not:** Charge money yet.

---

## Step 7 — Stripe billing

**Status:** `done`

**Why:** Pro tier is the revenue path; only after O8 is closed (Step 1).

**Do**

- Stripe Checkout for Pro (monthly + annual per spec §10)
- Webhooks: subscription created/updated/canceled → tier updates
- Customer portal link for self-serve cancel
- Test mode end-to-end purchase flow

**Done when**

- [x] Test checkout upgrades user to Pro
- [x] Cancel/downgrade returns user to Free with correct entitlements
- [x] No secrets in git; webhook signature verified

**Shipped:** `POST /api/billing/checkout|portal|webhook` · `Account.stripeCustomerId` / `stripeSubscriptionId` · `/billing` · HMAC webhook verify (no Stripe npm package) · e2e `billing.e2e-spec.ts`

**Do not:** Pro+ / Career tier (Phase 3); team billing.

---

## Step 8 — Tier enforcement

**Status:** `done`

**Why:** Spec §12.3 — quotas and fair-use visible in UI; Free tier limits from §10.

**Do**

- **Free:** enforce quota (per O3 — 3/week recommended); **no full trace on hidden runs** (spec §10)
- **Pro:** fair-use cap per O8 decision; full traces and hints
- Clear learner-facing errors on quota/budget breach
- `GET /api/me` (or equivalent) exposes tier + remaining quota

**Done when**

- [x] Free user blocked at quota with actionable message
- [x] Free user cannot see gated trace fields; Pro can
- [x] Pro fair-use kill matches Step 1 numbers
- [x] Tests cover tier gates

**Shipped:** 429 on submit at Free 3/week and Pro 60/30d · Free traces return `gated` (no queries/payload) · first hint free, further hints 403 · `GET /api/me` includes `attemptsRemaining` · e2e `tier-enforcement.e2e-spec.ts`

**Do not:** Contests gating (Phase 2).

---

## Step 9 — Onboarding

**Status:** `done`

**Why:** Activation is the Phase 1 metric; spec calls for **3-minute first-solve**.

**Do**

- Post-signup path: pick one easy exercise (R1 or P1) → pre-filled or guided first submission → scorecard
- Skip catalogue noise for first session
- Measure time-to-first-pass event (analytics hook)

**Done when**

- [x] New user can reach first grade/scorecard without hunting the UI
- [x] Median time-to-first-submit under 3 minutes in internal dogfood
- [x] Onboarding does not expose hidden eval content

**Shipped:** `/onboarding` with prefilled R1 starter · first-session skip of `/catalogue` · `GET /api/me.onboarding` · `POST /api/me/events` (`first_submit` / `first_pass`) · e2e `onboarding.e2e-spec.ts`

**Do not:** Full marketing site; tutorial videos.

---

## Step 10 — Engagement

**Status:** `todo`

**Why:** Spec §8 — streaks and daily drills are the habit engine.

**Do**

- **Daily drill:** one short exercise per day (rotate from catalogue)
- **Streak counter** on progress screen
- **Solve history:** list of attempts with verdicts and exercise links
- Server-side streak logic (timezone-aware)

**Done when**

- [ ] Daily drill surfaces a solvable exercise once per calendar day
- [ ] Streak increments on pass (or defined rule) and resets correctly
- [ ] History shows last N attempts for authenticated user

**Do not:** Contests; leaderboard.

---

## Step 11 — Public profile v1

**Status:** `todo`

**Why:** Spec §8 — shareable profile is credential precursor (full verified credential is Phase 3).

**Do**

- Public URL slug per user (opt-in)
- Shows: display name, verified solves count, skill radar snapshot, recent public-safe stats
- Does **not** show hidden eval details, full traces, or PII
- Free vs Pro: define what is public (working position: solves + radar for Pro users who opt in)

**Done when**

- [ ] Shareable link loads without auth
- [ ] No hidden canaries or trace secrets in HTML/JSON
- [ ] User can enable/disable public profile

**Do not:** Employer verified report (Phase 3).

---

## Step 12 — Catalogue to 50 + Phase 1 sign-off

**Status:** `todo`

**Why:** Phase 1 exit gate from spec + phase.md.

**Do**

- Publish **50** exercises with target mix (~40% RAG+Prompt, 30% Eval, 30% Guardrails)
- Re-run leakage grep + reference/near-miss CI on full catalogue
- Soft launch or beta invite; track signup, activation, D7, Pro margin
- Document known gaps vs full spec §0.8 (if any still deferred from inner POC)

**Done when**

- [ ] **50** exercises listed and gradable
- [ ] Each has reference pass + near-miss fail
- [ ] Leakage grep clean
- [ ] **≥ 1,000 signups** (or agreed beta cohort proxy)
- [ ] **Activation > 40%**, **D7 > 25%**
- [ ] **Gross margin positive on Pro** at agreed O8 numbers
- [ ] Teammate can complete onboarding → Pro purchase → daily drill → public profile without support

**Later (not Phase 1):** contests, Agent simulator, verified assessments, tutors, teams.

---

## Open decisions (Phase 1)

| ID | Decision | When | Working position (phase.md) |
|---|---|---|---|
| O2 | Brand — LabPath vs Bina | Step 1 | Keep LabPath; “by Bina” endorsement |
| O3 | Free tier — 3/month vs 3/week | Step 1 | Start generous: **3/week** |
| O8 | Unit economics vs €19 Pro | **Before Step 7** | Must resolve: judge tier, fair-use, price, cache |

---

## Exercise checklist (fill during Steps 2–3 and 12)

| Band | Phase 0 | Phase 1 target | Simulators |
|---|---|---|---|
| RAG | 4 | ~8–10 | RAG |
| Prompt | 0 → **1 (P1)** | ~10–12 | Prompt Engineering |
| Eval | 3 | ~15 | Evaluation |
| Guardrails | 3 | ~15 | Guardrails |
| **Total** | **10** → **11** | **50** | 4 simulators |

---

## Next

When Step 12 is `done`, re-spec Phase 2 from [phase.md](./phase.md) before starting Agent + Benchmark work.
