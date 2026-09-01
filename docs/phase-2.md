# Phase 2 — Depth & competition

How we build Phase 2. One step at a time. Do not skip ahead. Do not start Phase 3 from this file.

Roadmap of all phases: [phase.md](./phase.md). Product rules: [LabPath-Specification.md](./Labpath%20specification/LabPath-Specification.md) Part 2. Phase 1 sign-off: [phase-1-signoff.md](./phase-1-signoff.md).

**Kind:** depth and competition — two new simulators, ranked play, more catalogue. Not verified assessments, employer credentials, or tutor marketplace.

**Goal:** a Pro learner can solve Agent and Benchmark exercises, follow a guided path, enter a timed contest, and see a team-free leaderboard. Exit: **Agent + Benchmark live**, **contests running**, **150 exercises**.

**Duration:** ~12 weeks (per spec).

**Now:** Step 12 `done`. Phase 2 complete. Re-spec Phase 3 from [phase.md](./phase.md) before verified assessments. Decisions: [phase-2-decisions.md](./phase-2-decisions.md).

| Status | Meaning |
|---|---|
| `todo` | Not started |
| `doing` | Current step — only one at a time |
| `done` | Accepted; do not reopen unless broken |

---

## Rules

- Finish a step’s **Done when** before starting the next.
- **A1 is the go/no-go.** If A1 does not grade with real tools in the sandbox, do not seed more Agent exercises or start Benchmark.
- Hidden eval sets never appear in API responses, traces, errors, leaderboards, or contest recaps (carry forward from Phase 0–1).
- Agent runtime is a **dedicated workstream + security review**, not a single ticket — same bar as Phase 1 sandbox.
- Reuse the Phase 0 workspace shell. Visual polish is optional and separate from these steps.
- Build only what the current step names.
- Carry forward Phase 1 locks: LabPath by Bina, Free 3/week, Pro €24/mo · 60 attempts/30d, gVisor Python sandbox (512 MB / 30 s) for existing BYOC.

## In (Phase 2)

- **Agent & Tool Use** simulator (#5): real tools in the sandbox, multi-step traces, loop/cost ceilings, error-recovery scoring
- **Benchmark Playground** simulator (#6): run frozen benchmarks, harness variance, contamination, why leaderboard deltas are often noise
- **Contests** — timed, novel, ranked, seasonal (spec §8, §12.4)
- **Guided paths** — ordered exercise sequences, still no lessons
- **Team-free leaderboards**
- Catalogue **50 → 150** exercises

## Out (defer to later phases)

- Neural Network and Fine-tuning simulators (Phase 3)
- Verified assessments, employer-facing credential (Phase 3)
- Skill decay / recency weighting as a product surface (Phase 3)
- Tutor marketplace (Phase 4)
- Teams, SSO/SCIM, LTI, team leaderboards (Phase 5)
- Courses, video lessons, marketing landing redesign
- Pro+ / Career tier, i18n, mobile polish

---

## Step list

| Step | Name | Status | Unlocks |
|---|---|---|---|
| 1 | Kickoff & decisions | `done` | O9 locked; Agent limits + contest rules + mix frozen |
| 2 | Agent runtime | `done` | Multi-step sandbox + allowlisted tools (security-reviewed) |
| 3 | Agent harness + A1 | `done` | Fifth simulator; first Agent exercise grades |
| 4 | Traces, ceilings, recovery | `done` | Multi-step trace + loop/cost kill + error-recovery score |
| 5 | Agent content slice | `done` | Several Agent exercises playable, not only A1 |
| 6 | Benchmark harness + B1 | `done` | Sixth simulator; first Benchmark exercise grades |
| 7 | Variance & contamination | `done` | Playground teaches why leaderboards lie |
| 8 | Guided paths | `done` | Ordered sequences in catalogue, no lessons |
| 9 | Team-free leaderboards | `done` | Public ranking without teams or hidden eval |
| 10 | Contests | `done` | Timed, novel, ranked, seasonal event |
| 11 | Catalogue to 150 | `done` | 150 listed and gradable |
| 12 | Phase 2 sign-off | `done` | Exit metrics met |

---

## Step 1 — Kickoff & decisions

**Status:** `done`

**Why first:** Agent isolation and contest rules are expensive to reverse. Phase 1 already flagged Firecracker as a Phase 2 re-evaluate.

**Do**

- Lock **O9** (Agent isolation: keep gVisor with longer limits vs Firecracker microVM)
- Lock Agent resource envelope (wall clock, memory, no persistent FS, network still gateway-only)
- Lock v1 **tool allowlist** (simulated + executed in sandbox; no arbitrary egress, no real email/SMS)
- Confirm spec §10: **contests are Pro**; Free cannot enter
- Confirm spec §12.4 contest anti-cheat for v1: problem pool + per-user sample + time-box; paste-pattern telemetry only if cheap
- Freeze catalogue mix for 150 (working position in the checklist below)
- Write [phase-2-decisions.md](./phase-2-decisions.md)
- Update [phase.md](./phase.md) “Now” pointer to this file

**Done when**

- [x] Written decision record for O9, Agent limits, tool allowlist, contest eligibility
- [x] Team agrees Step 2 is next (runtime before A1; Benchmark does not start until A1 grades)
- [x] Security review owner named for Step 2

**Record:** [phase-2-decisions.md](./phase-2-decisions.md)

**Do not:** Agent harness code, contest UI, 100 new exercises, Firecracker build unless O9 picks it.

---

## Step 2 — Agent runtime

**Status:** `done`

**Why:** Spec §6 — Agent is a different machine from “submit config → hidden set”. Real tool execution needs a reviewed runtime before the first exercise.

**Do**

- Extend Phase 1 sandbox (`infra/sandbox/`, `SandboxModule`) for **multi-step** jobs under Step 1 limits
- Tool host: allowlisted tools run inside the sandbox; calls are logged (name, args, result, duration)
- Network still **only** the allowlisted model gateway; tools that “fetch” go through that gateway or a fixture, never the public internet
- No persistent FS between steps; workspace is per-run
- Update [sandbox-security-checklist.md](./sandbox-security-checklist.md) for Agent (escape, egress, fork/tool amplification)
- Smoke: a trivial agent loop that calls one allowlisted tool and exits

**Done when**

- [x] Security review signed off for the Agent envelope
- [x] Tool-call log is produced without mounting hidden eval into the sandbox
- [x] Over-time and over-memory still map to `sandbox_timeout` / `sandbox_oom`
- [x] `npm run sandbox:smoke` (or Agent equivalent) covers tool allowlist + egress block

**Shipped:** `labpath_tools` in the sandbox image · `AGENT_SANDBOX_DEFAULTS` (180 s, BYOC stays 30 s) · `SandboxService.runAgent` · tool log via `LABPATH_TOOL_LOG:` stderr marker · `agent-runtime.spec.ts` + integration Agent cases · checklist Agent addendum

**Do not:** Grade A1 yet; Benchmark; contests; lengthen limits for existing RAG BYOC exercises unless Step 1 said so.

---

## Step 3 — Agent harness + A1

**Status:** `done`

**Why:** Same shape as Phase 0 R1 / Phase 1 P1 — one playable exercise is the go/no-go.

**Do**

- Add `agent` simulator module + harness folder (mirror `prompt-engineering/` / `rag/`)
- Submission schema: agent prompt / tool schemas / optional Python entry — **no unconstrained network**
- Seed **A1** (`agt-001-…`) with public + hidden eval; win/fail is **class A events** on the tool log (correct tool, correct args, canary never leaked) — not a judge rating
- Authoring template under `content/templates/agent/`
- Grade pass/fail + scorecard in worker; leakage grep still passes
- Workspace plays A1 end-to-end (reuse shell)

**Done when**

- [x] A1 playable via HTTP (attempt → submit → grade)
- [x] Reference passes; near-miss fails in tests
- [x] Hidden canaries never in grade/trace/API JSON
- [x] Catalogue lists A1 under Agent & Tool Use
- [x] Learner code cannot read hidden eval files or env secrets (carry forward Step 5 Phase 1)

**Shipped:** `agt-001-call-the-right-tool` · harness `agent/` · `AgentHarness` + `gradeA1` · class A on tool log (`calculator` + `json_store`) · `tasks.json` has no canaries · tests `a1.grade.spec.ts`, `agent-grade.e2e-spec.ts` · workspace `source` textarea

**Do not:** Full Agent catalogue; Benchmark; loop-ceiling productisation beyond what A1 needs to grade.

---

## Step 4 — Traces, ceilings, recovery

**Status:** `done`

**Why:** Spec Phase 2 Agent bullet — multi-step traces, loop/cost ceilings, error-recovery scoring. A1 proves the harness; this step makes Agent a lab, not a single tool call.

**Do**

- Trace shows each step: model call, tool name, args summary, result size, duration — **no hidden task text, no secrets**
- Loop ceiling: max steps / max tool calls; kill with a clear learner-facing code (`killed_loop` or existing budget kill)
- Cost ceiling: Agent runs still hit `BudgetEnforcer` (tokens + sandbox time)
- Error-recovery score (class A): retry after a tool error, no infinite repeat of a failing call
- Wall-clock remains **information, not a pass gate** (spec §7.7)

**Done when**

- [x] A1 (or a dedicated follow-on) trace is readable without leaking hidden eval
- [x] Over-loop and over-budget attempts fail safely with an actionable message
- [x] Recovery near-miss (ignore tool errors / tight loop) fails; reference recovers
- [x] Tests cover ceilings + leakage

**Shipped:** sanitized Agent `steps` trace (args summary + result bytes + duration) · runtime + grader **8 steps / 12 tool calls** → `killed_loop` · Agent `BudgetEnforcer` still kills on tokens/cost, not wall-clock · A2 `agt-002-recover-and-stop` (retry after tool error; tight-loop near-miss) · workspace trace table for Agent steps

**Do not:** Benchmark; contests; Firecracker rewrite unless Step 2 already required it.

---

## Step 5 — Agent content slice

**Status:** `done`

**Why:** One exercise is a POC. The simulator is real when several difficulties exist.

**Do**

- Publish a small Agent set beyond A1 (working position: **≥ 5** including A1) covering tool-schema, planning, error recovery, loop control, cost ceilings
- Each has reference pass + near-miss fail
- `content:validate` + `content-pipeline.spec.ts` include Agent
- Skills stay on the existing graph; do not invent free tags (spec §5)

**Done when**

- [x] ≥ 5 Agent exercises listed and gradable
- [x] Mix includes at least one Easy and one Medium/Hard
- [x] Leakage grep clean on the new slugs

**Shipped:** A3 `agt-003-plan-the-sequence` (E, calc before store) · A4 `agt-004-call-budget` (M, ≤ 3 calls, `cost-engineering`) · A5 `agt-005-dedupe-and-halt` (H, duplicate tasks, ≤ 2 calls) · slice with A1/A2 is 5 graded Agent exercises

**Do not:** Jump to 25 Agent exercises here; Benchmark still waits; contests.

---

## Step 6 — Benchmark harness + B1

**Status:** `done`

**Do only after Step 3 is done** (A1 go/no-go). Benchmark does not need Agent tools, but we do not start a sixth simulator while Agent is unproven.

**Why:** Spec #6 — reading and running benchmarks, harness variance, contamination.

**Do**

- Add `benchmark` simulator module + harness folder
- Frozen fixtures only at grade time (same Eval rule: no live generation of the benchmark corpus)
- Seed **B1** (`bnch-001-…`): learner compares two harness configs (or two seeds) on the same frozen set
- Pass (class A): they identify that a raw accuracy delta is **not** a real model win (CI / seed / prompt wrapper)
- Template under `content/templates/benchmark/`
- Catalogue lists B1 under Benchmark Playground

**Done when**

- [x] B1 playable end-to-end via HTTP
- [x] Reference passes; near-miss (treats noise as a ranking win) fails
- [x] Hidden canaries never in grade/trace/API JSON

**Shipped:** B1 `bnch-001-two-harnesses-one-score` · harness `benchmark/` · `BenchmarkHarness` + `gradeB1` on frozen A/B traces (28/40 vs 31/40, overlapping Wilson CIs) · class A: `noise` + `ci_overlap`/`seed_or_wrapper` · near-miss `b_wins` + `better_model` · tests `b1.grade.spec.ts`, `bench-grade.e2e-spec.ts` · catalogue filter Benchmark Playground

**Do not:** Live public LLM leaderboards; downloading arbitrary Hugging Face jobs; contests.

---

## Step 7 — Variance & contamination

**Status:** `done`

**Why:** B1 is the hello-world. The playground’s point is *why leaderboards lie*.

**Do**

- Exercises (or B1 extensions) for **harness variance** (prompt wrapper, few-shot, decode params) and **contamination** (overlap between train-like text and eval items)
- Scorecards show interval / seed sensitivity, not a single headline %
- At least **≥ 3** Benchmark exercises total (including B1)
- Do not gate pass/fail on wall-clock of the benchmark run

**Done when**

- [x] ≥ 3 Benchmark exercises listed and gradable
- [x] At least one contamination item and one variance item
- [x] Reference / near-miss / leakage tests pass

**Shipped:** B2 `bnch-002-same-checkpoint-decode` (M, same seed, greedy 34/40 vs T=0.9 16/40, CIs separate — harness-only + decode params) · B3 `bnch-003-eval-overlap` (M, clean slice tied 20/28, lift on 12 overlap tickets) · scorecards + workspace show Wilson / seed / decode / slices · tests `b2.grade.spec.ts`, `b3.grade.spec.ts`, `bench-grade.e2e-spec.ts` · catalogue now 3 Benchmark exercises

**Do not:** External live leaderboard scrape; Neural Network simulator (Phase 3).

---

## Step 8 — Guided paths

**Status:** `done`

**Why:** Spec Phase 2 — ordered sequences, still no lessons. Catalogue noise is the activation risk as we grow toward 150.

**Do**

- Path model: ordered list of published exercise slugs, title, short intent — **no markdown lessons, no video**
- `GET` paths + path progress for the authenticated user (how many steps passed)
- Catalogue / home can start a path; workspace still one exercise at a time
- Seed **≥ 2** paths from existing catalogue (e.g. RAG fundamentals, Guardrails red-team) — Agent/Benchmark optional if those exercises exist
- Free users can follow paths within their weekly quota; paths do not bypass quotas

**Done when**

- [x] Learner can open a path and jump to the next unsolved step
- [x] Completing the last step marks the path complete
- [x] Path JSON never includes hidden eval

**Shipped:** `GET /api/paths` + `GET /api/paths/:slug` · progress derived from pass grades (no enrollment table) · seeded `rag-fundamentals` and `guardrails-red-team` · catalogue PathStrip + `/paths` · Continue jumps to next unsolved · last pass marks complete · tests `path-progress.spec.ts`, `paths.e2e-spec.ts`

**Do not:** Course CMS; certificates; team assignments (Phase 5).

---

## Step 9 — Team-free leaderboards

**Status:** `done`

**Why:** Spec Phase 2 — team-free leaderboards. Contest rating lands on the public profile (spec §8).

**Do**

- Individual ranking only (no orgs, no teams)
- Identity is the **opt-in public profile slug** (Phase 1); unpublished users do not appear
- Rank by a documented rule (working position: contest rating when contests exist; until Step 10, verified solves + recent pass count is enough)
- Payload is public-safe: display name, slug, solve counts, rating — **no email, user id, traces, hidden eval**
- Free can **view**; appearing on the board follows the same Pro + opt-in rule as public profiles unless Step 1 recorded otherwise

**Done when**

- [x] `GET` leaderboard works without leaking PII or canaries
- [x] Opt-out / private profile removes the user from the board
- [x] Tests cover empty board, opt-in, leakage

**Shipped:** `GET /api/leaderboard` (public) · rank = unique verified solves, then 30-day pass count · `rating = solves * 100 + recentPasses` until contests · same Pro + opt-in gate as `/u/:slug` · public `/leaderboard` page · tests `leaderboard-rank.spec.ts`, `leaderboard.e2e-spec.ts`

**Do not:** Team boards; Elo grind that requires contests before Step 10 ships a contest.

---

## Step 10 — Contests

**Status:** `done`

**Why:** Spec §8 — ranked contests are the growth engine. Exit requires contests **running**, not a mock UI.

**Do**

- Contest object: window (start/end UTC), eligible exercise pool, per-user sample, time-box
- **Pro only** to enter (spec §10); Free sees a locked CTA
- Novel problems: pool is not the public catalogue’s daily drill; hidden eval still server-side
- Ranking: score + time tie-break; results feed the leaderboard + public profile **contest rating**
- Seasonal v1: ship **one** contest that can actually open (even if the first season is dogfood)
- Anti-cheat v1: pool-and-sample + time-box; paste-pattern telemetry only if Step 1 said it is in
- Hints off (or paid-tier contest policy documented); traces follow existing Free/Pro gates

**Done when**

- [x] A Pro user can enter, submit, and see a contest scorecard
- [x] Free user cannot enter (clear upgrade message)
- [x] Per-user sample recorded (`sample_seed`); hidden pool never in API
- [x] Leaderboard shows contest results after the window
- [x] Teammate can finish one contest attempt without support

**Shipped:** `ContestsModule` · `GET/POST /api/contests` · Pro gate on enter · `sampleSeed` + pool sample (2 of 4) · contest-only exercises `ctst-001`–`ctst-004` (`isPublished: false`) · dogfood season `dogfood-s1` · contest workspace (hints off) · leaderboard switches to contest rating after window closes · profile `contestRating` · tests `contest-rank.spec.ts`, `contest-sample.spec.ts`, `contests.e2e-spec.ts` · web `/contests`, `/contests/[slug]`, problem workspace

**Do not:** Verified / proctored assessments (Phase 3); year-long season ops; cheating witch-hunts that cripple practice UX (spec §12.4).

---

## Step 11 — Catalogue to 150

**Status:** `done`

**Why:** Exit count. Pipeline already exists (Phase 1 Step 3) — this is authoring + ingest, not a new CI invention.

**Do**

- Publish until **150** with the mix locked in Step 1 (working position in the checklist)
- Templates for Agent + Benchmark already from Steps 3 and 6; keep RAG / PE / Eval / Guardrails growing
- Every new exercise: `meta.json`, public + hidden eval, reference + near-miss
- Version bumps on content change; historical grades keep `exercise_version`
- Re-run `content:validate` + content-pipeline tests on the full set

**Done when**

- [x] **150** exercises listed and gradable
- [x] Each has reference pass + near-miss fail
- [x] Leakage grep clean
- [x] Mix matches the Step 1 record (within the bands in the checklist)

**Shipped:** `generate-step11-exercises.mjs` (+92 slugs) · **150 published** (25 RAG / 20 PE / 30 Eval / 30 Guardrails / 25 Agent / 20 Benchmark) · slug routing extended in `exercises.constants.ts` · `content:validate` clean · `content-pipeline.spec.ts` at 150 · contest-only `ctst-*` stays unpublished

**Do not:** Neural Network / Fine-tune content; contest problem pools mixed into the public catalogue by accident.

---

## Step 12 — Phase 2 sign-off

**Status:** `done`

**Why:** Phase 2 exit gate from spec + phase.md.

**Do**

- Confirm Agent + Benchmark are playable in the UI (not only HTTP)
- Confirm at least one contest has run (or is in a live window) with a ranking
- Confirm 150 + leakage + reference/near-miss CI
- Teammate walkthrough: A1 → a guided path → contest entry → leaderboard → public profile rating
- Document known gaps vs full spec (paste telemetry, Firecracker, live blend) in `phase-2-signoff.md`
- Do not fake signup/activation numbers; those remain Phase 1 public-beta metrics

**Done when**

- [x] Agent & Tool Use live (≥ 5 exercises, A1 go/no-go still green)
- [x] Benchmark Playground live (≥ 3 exercises)
- [x] Contests running (Pro enter + rank)
- [x] **150** exercises; reference pass / near-miss fail; leakage clean
- [x] Team-free leaderboard + ≥ 2 guided paths
- [x] Teammate completes the walkthrough without support
- [x] Sign-off file written

**Shipped:** [phase-2-signoff.md](./phase-2-signoff.md) · catalogue dedupe + `pageSize` 200 · e2e pageSize bump · ingest unpublishes older versions

**Do not:** Phase 3 verified assessments; tutor marketplace; start Neural Network.

---

## Open decisions (Phase 2)

| ID | Decision | When | Working position |
|---|---|---|---|
| O9 | Agent isolation — gVisor vs Firecracker | Step 1 | **Locked:** keep gVisor; Agent jobs 180 s; Firecracker out of Phase 2 — [phase-2-decisions.md](./phase-2-decisions.md) |
| — | Agent envelope | Step 1 | **Locked:** 512 MB · 180 s · no persistent FS · gateway-only · 8 steps / 12 tool calls |
| — | Tool allowlist v1 | Step 1 | **Locked:** `calculator`, `json_store`, `fixture_fetch` |
| — | Contest eligibility | Step 1 | **Locked:** Pro only; pool + sample + time-box; paste telemetry out of v1 |
| — | Catalogue mix | Step 1 | **Locked:** 25 / 20 / 30 / 30 / 25 / 20 → 150 |

O2, O3, O8 stay as Phase 1 locked. Do not reopen them here.

---

## Exercise checklist (fill during Steps 3–7 and 11)

| Band | Phase 1 | Phase 2 target | Shipped | Simulators |
|---|---|---|---|---|
| RAG | 10 | **25** | **25** | RAG |
| Prompt | 10 | **20** | **20** | Prompt Engineering |
| Eval | 15 | **30** | **30** | Evaluation |
| Guardrails | 15 | **30** | **30** | Guardrails |
| Agent | 0 | **25** | **25** | Agent & Tool Use |
| Benchmark | 0 | **20** | **20** | Benchmark Playground |
| **Total** | **50** | **150** | **150** | **6** simulators live |

RAG+Prompt+Agent+Benchmark = 90. Eval 30 / Guardrails 30. Locked in [phase-2-decisions.md](./phase-2-decisions.md).

**First exercises (name during Steps 3 and 6):**

| ID | Working title | Step | Skills (from spec §6) |
|---|---|---|---|
| **A1** | Call the Right Tool | 3 | tool-schema, planning — **shipped** `agt-001-call-the-right-tool` |
| **A2** | Recover and Stop | 4 | error-recovery, loop-control — **shipped** `agt-002-recover-and-stop` |
| **A3** | Plan the Sequence | 5 | planning, tool-schema — **shipped** `agt-003-plan-the-sequence` |
| **A4** | Call Budget | 5 | cost-engineering, loop-control — **shipped** `agt-004-call-budget` |
| **A5** | Dedupe and Halt | 5 | loop-control, planning — **shipped** `agt-005-dedupe-and-halt` |
| **B1** | Two Harnesses, One Score | 6 | harness-variance, evaluation-reading — **shipped** `bnch-001-two-harnesses-one-score` |
| **B2** | Same Checkpoint, Different Decode | 7 | harness-variance, evaluation-reading — **shipped** `bnch-002-same-checkpoint-decode` |
| **B3** | The Eval Overlap | 7 | contamination, evaluation-reading — **shipped** `bnch-003-eval-overlap` |

---

## Next

When Step 12 is `done`, re-spec Phase 3 from [phase.md](./phase.md) before verified assessments or Neural Network / Fine-tuning work.
