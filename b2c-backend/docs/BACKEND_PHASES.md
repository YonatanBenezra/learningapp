# b2c-backend — Phased Implementation Plan

Backend-first build. Frontend integration is a **separate track that follows** — the API
contract in spec §4 is the seam between them. This doc converts the full production spec
(ABC Requirements v3, §0–§15) into ordered, testable phases. Every spec section is mapped
to a phase in the **Coverage Matrix** at the bottom — nothing is dropped.

Legend: **DoD** = Definition of Done (phase is not "done" until these pass, tests included).

## Progress

- ✅ **Phase 0 — Foundation & Infrastructure** (done: env/zod, Mongo+Redis, BullMQ, pino+request-id, error/validate/404, `/health` + `/health/ready`, eslint/prettier/vitest, smoke test; verified live boot + graceful shutdown).
- ✅ **Phase 1 — Auth & User** (done: User model w/ toJSON secret-stripping, bcrypt signup/login, JWT access+refresh with **rotation + reuse detection** via RefreshToken families, `authenticate` + `requireRole` (403/200 tested), basic redis rate limiter (429 tested), OAuth create/link + Google verify endpoint (501-plumbing tested), `GET`/`PATCH /users/me`; **23 tests green** + live flow verified. Note: live Google id-token verification needs `GOOGLE_CLIENT_ID`).
- ✅ **Phase 2 — Shared AI Provider Layer** (done: provider-agnostic `AiProvider` seam + `AnthropicProvider` (Claude Opus 4.8, lazy SDK client, SDK retries off), `AiClient` with retry+exponential-backoff, per-call token/cost accounting → `AiUsage` model + pino log, zod-validated structured output (JSON-in-text + schema re-validation, decoupled from SDK's zod-v4 helper), typed `AiError`, prompt templates; **21 tests green** — client: structured output, cost calc, retry/non-retry/give-up, malformed→typed-error, schema re-validation; provider: `extractJson` (fences/prose/arrays/non-JSON) + `wrapError` classification incl. **timeout→retryable path**. Note: uses `AI_PROVIDER_API_KEY` (Anthropic key); live Claude calls not exercised — provider mocked; the `AnthropicProvider` request path (`messages.create`) itself only runs against a real key).
- ✅ **Phase 3 — Course Generation** (done: Course/Module/Lesson models finalized (toJSON→id, `failureReason`); `course.generator` (zod `GeneratedCourse` tree schema → `AiClient.completeStructured`); `course.service` (`createCourse`+enqueue+**free-tier 1-active gate**, `getCourse`, ordered `getStructure` tree for React Flow, `listCourses`, `runCourseGeneration` worker logic w/ **generating→ready/failed** transitions, idempotent); **lazy** BullMQ queue + `courseGenerationWorker` (real Worker) wired into `server.ts`; routes `POST /courses` (202), `GET /courses`, `/:id`, `/:id/structure`; **12 tests green** — 202/auth/400-validation/free-limit/**premium-bypass**, worker success+failure+idempotent+**non-existent-course no-op**, ordered structure, ownership 404, **full BullMQ e2e (POST→worker→ready)** — plus live boot verified (real worker consumed job, graceful failure w/o AI key). Note: real Claude happy-path (→ready with AI content) needs `AI_PROVIDER_API_KEY`; tests inject a fake generator).
- ✅ **Phase 4 — Lessons & Progress** (done: `UserLessonProgress` (unique `userId+lessonId`, denormalized `courseId`) + `courseId` on `Lesson`; `lesson.service` — ownership-checked `getLesson`, `startLesson` (in_progress, no-downgrade), `completeLesson` (daily **streak** via pure `nextStreak` + **`Course.progressPercent` recompute**, 100%→`completed`); `progress.service.listProgress` (courseId filter); routes `GET /lessons/:id`, `POST /lessons/:id/start`, `POST /lessons/:id/complete`, `GET /progress`; **15 tests green** — ownership 404 / 401 / malformed-id, start+complete, streak day-logic (new/consecutive/reset/same-day) incl. injected-now consecutive, progress% + 100%→completed, idempotent (incl. same-day streak not bumping), unique-index enforcement, progress list + **two-course courseId filter**).
- ✅ **Phase 5 — Assessments (Quiz & Exam)** (done: `Quiz`/`Exam` (toJSON **strips correctAnswer** so the key never leaks when taking) + `QuizSubmission`/`ExamSubmission` with `results[]`; shared zod `GeneratedAssessment` schema; `grading.service` — **rule-based MCQ (no AI)** + injectable AI short-answer judge → score+results; `quiz.service` (generateQuiz + regenerate, getQuiz, submitQuiz) reusing `resolveOwnedLesson`; `exam.service` (module + course scope generate w/ ownership, getExam, submitExam); routes `POST /lessons/:id/quizzes`, `GET /quizzes/:id`, `POST /quizzes/:id/submit`, `POST /modules/:id/exam`, `POST /courses/:id/exam`, `GET /exams/:id`, `POST /exams/:id/submit`; **16 tests green** — MCQ rule-based (throwing judge never called), case-insensitive MCQ, short-answer via injected judge (unit + through submitQuiz), generate + regenerate, submit graded w/ correct answers, exam both scopes, answers-stripped-on-fetch, ownership 404 (quiz gen/submit, exam gen/submit), 401. Note: real Claude generation + short-answer grading need `AI_PROVIDER_API_KEY`; tests inject fakes).
- ✅ **Phase 6 — Exercises & Grading** (done: `Exercise` (taskSpec: description/starterState/rubric, domain) + `ExerciseSubmission` (submissionData, score, feedback, status, gradedAt) w/ toJSON; `exercise.service` — `generateExercise` (ownership + domain inherited from Module, before AI), `getExercise`, `getSubmission`, `submitExercise` (records `submitted` + enqueues grading); `grading.service` — injectable AI `evaluateSubmission` + `gradeExerciseSubmission` (**submitted→grading→graded**, idempotent, graceful failure→graded+null score); **BullMQ grading worker** wired into `server.ts`; routes `POST /lessons/:id/exercises`, `GET /exercises/:id`, `GET /exercises/submissions/:sid`, `POST /exercises/:id/submit`; **13 tests green** — generate + domain + `general` fallback, submit→submitted, grade transitions (incl. **intermediate `grading` observed**), idempotent re-grade, failure→graded, non-existent-submission no-op, **full BullMQ async flow (submit→worker→graded)**, ownership 404 (generate/submit/read exercise/read submission). Note: real Claude exercise generation + AI grading need `AI_PROVIDER_API_KEY`; tests inject fakes).
- ✅ **Phase 7 — AI Cost Governance (Usage Quota & Rate Limiting)** (done: per-day `UsageQuota` doc keyed by `userId+period+periodStart` — a new UTC day = a fresh doc, so **no reset job needed**; `usageQuota.service` — `consumeQuota(userId,tier,kind,now?)` (ensure-today's-doc upsert w/ benign E11000 catch, then **race-safe atomic conditional `$inc` gated on `counts.<kind> < limit`** → `QuotaError` 429 when over), `getQuota` snapshot, `limitFor`, kind→count/limit maps; `usageQuota(kind)` middleware (429 + `X-Quota-Limit`/`X-Quota-Remaining` headers, runs after `authenticate`, before AI controllers); tier-aware `userRateLimit` (keyed by user, free/premium max, `X-RateLimit-*` headers) + shared `aiRateLimit` (30/min free, 120/min premium) + headers added to the existing IP `rateLimit`; **wired `aiRateLimit` + `usageQuota(kind)` onto every AI-generation route** — `POST /courses` (course), `POST /lessons/:id/quizzes` (quiz), `POST /lessons/:id/exercises` (exercise), `POST /modules/:id/exam` + `POST /courses/:id/exam` (exam) — and **properly wired `POST /modules/:id/exam`** (was a `// TODO` stub returning notFound-404; the P5 test had been passing for the wrong reason); **11 tests green** — consumeQuota under/over→429/new-day-reset/premium-higher/per-kind-isolation, **concurrency race-safety (8 simultaneous → exactly 3 succeed, 5 QuotaError, persisted count == limit)**, `getQuota` empty + after-use, middleware HTTP 429 (seed-at-limit) w/ headers + body `{kind,limit}`, middleware **success path** (headers + remaining decrements across requests), `userRateLimit` free 429 + headers, `userRateLimit` **premium higher max**. Existing suites updated to `redis.disconnect()` in teardown (AI routes now touch the shared redis via `aiRateLimit`). **Total 111 tests green** (deterministic across repeated full-suite runs), typecheck/lint(0 err)/build clean.
  - **Bug found + fixed during audit:** the race-safe counter depends on the unique `userId+period+periodStart` index, but the app only had Mongoose's lazy background `autoIndex` — so during the cold-start build window concurrent upserts created **duplicate quota docs and bypassed the limit** (the concurrency test caught 6/8 succeeding under load). Fixed by adding `ensureIndexes()` in `config/db.ts` (awaits every model's `init()`) and calling it in `server.ts` **before the server listens**; the test awaits `UsageQuota.init()` in `beforeAll`.
  - Note: per-kind daily caps come from `TIER_LIMITS` (`config/constants`); Stripe-driven tier changes + entitlement gating land in P8. Known limitation (deferred to P8): quota is **pre-consumed by the middleware before the controller's entitlement check**, so a request rejected by e.g. the 1-active-course 403 still burns a quota unit — acceptable for now, to be reordered when P8 entitlement gating lands. Defensive branches left untested (unreachable in current wiring): E11000 concurrent-insert catch, non-QuotaError→`next(err)`, unauthenticated IP fallback.).
- ⬜ Phases 8–14 — pending.

---

## Phasing principles

1. **Foundation → identity → content → governance → labs → engagement → ops.**
2. Each phase ships a **vertical slice that is testable on its own** (models + endpoints + tests).
3. Cross-cutting concerns (validation, error handling, indexes, tests) are built **inside every
   phase**, not deferred to the end. The final phase is hardening/observability, not a cleanup dump.
4. **Labs (Phase 9) is an isolated, highest-risk workstream** — it can run in parallel by a
   separate engineer once Phase 6 exists, and it must not block the core MVP backbone.

## Milestones (grouping)

| Milestone | Phases | Outcome |
|---|---|---|
| **A — Core MVP backbone** | P0–P6 | Sign up → generate course → consume lessons → quizzes/exams → generate+submit exercises (grading orchestration). |
| **B — Monetization & cost governance** | P7–P8 | Per-tier quotas, rate limits, Stripe subscriptions, entitlements. |
| **C — Labs (parallel workstream)** | P9 | Sandboxed code/terminal + SOC/network simulators. |
| **D — Engagement & operations** | P10–P14 | Gamification, notifications, admin, privacy, observability/hardening. |

## Dependency graph (high level)

```
P0 Foundation
 └─ P1 Auth/User
     ├─ P2 AI client ─┬─ P3 Course gen ─ P4 Lessons/Progress ─┬─ P5 Assessments
     │                │                                        └─ P6 Exercises ── P9 Labs*
     ├─ P7 Quota/RateLimit  (wires onto P3/P5/P6/P9 endpoints)
     ├─ P8 Subscriptions/Entitlements  (feeds P7 limits)
     ├─ P10 Gamification   (after P4)
     ├─ P11 Notifications  (after P4)
     ├─ P12 Admin          (after P3/P5/P6 content exists)
     └─ P13 Privacy        (after most models exist)
 P14 Observability / Perf / Security hardening  (cross-cutting, finalize)
* P9 Labs is an independent parallel workstream gated on a sandbox-infra decision (§15.2).
```

---

## Phase 0 — Project Foundation & Infrastructure

**Goal:** A booting, observable, safe-by-default Express/TS server wired to MongoDB + Redis.

- **Config:** `config/env.ts` with **zod validation** of all env vars (fail-fast on boot);
  `config/db.ts` Mongo connection + graceful shutdown; `config/constants.ts` (domains, statuses, tier limits placeholder).
- **App wiring:** `app.ts` middleware chain — `helmet`, `cors`, `express.json`, **request-ID
  correlation**, then routers, then `error.middleware`. `GET /health`.
- **Errors & utils:** `AppError`, `error.middleware`, `asyncHandler`, base `validate.middleware` (zod).
- **Async infra:** Redis connection + **BullMQ** queue registry (`jobs/queue.ts`) — queues declared, no consumers yet.
- **Logging:** structured logger (pino) with request-id.
- **Tooling:** eslint + prettier, `tsx` dev watch, `vitest`, `tsconfig` strict, npm scripts (`dev/build/start/typecheck/test/lint`).
- **Env (§13):** `.env.example` complete (Mongo, Redis, JWT, AI, sandbox, email, Stripe, CORS).
- **Depends on:** —
- **DoD:** `npm run dev` boots, connects Mongo + Redis; `GET /health` → 200; a thrown `AppError`
  renders correct status/JSON; typecheck + lint green; one smoke test passes.
- **Covers:** §2.5.1 (skeleton — scaffolded), §7.3 (`/health`, logging), §8 (Redis/BullMQ setup), §13 (env).

## Phase 1 — Auth & User Foundation

**Goal:** Secure identity — every later phase depends on `req.user` + tier + role.

- **Model:** `User` (email, passwordHash, oauth, `role: user|admin`, `tier: free|premium`,
  `preferences.{visualsPreferred,dailyNotification,timezone}`, `streak.{current,lastActivityDate}`).
- **Auth:** email+password (**argon2/bcrypt**) and **OAuth** (Google); JWT **access + refresh with
  rotation and reuse detection** (persist refresh token family; invalidate on reuse).
- **Middleware:** `auth.middleware` (verify access token → attach `req.user`); role guard (`requireRole('admin')`).
- **Validation + limits:** zod on all auth bodies; **rate limit auth endpoints** (basic redis limiter — full tiering in P7).
- **Endpoints:** `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`,
  `GET /users/me`, `PATCH /users/me` (preferences).
- **Depends on:** P0.
- **DoD:** signup→login→access protected route; refresh rotates; **reuse of an old refresh token is
  detected + rejected + family revoked** (tested); OAuth login creates/links a user; password never returned.
- **Covers:** §1.1, §7.1 (hashing, JWT rotation/reuse), §3 (User), §4 (users), §12 partial (users/me base).

## Phase 2 — Shared AI Provider Layer

**Goal:** One wrapper every generator calls — never the provider SDK directly.

- **`ai-guidance/ai.client.ts`:** provider-agnostic `complete()` / structured-output call; timeouts,
  retries with backoff, and **per-call cost/token accounting** (persisted for §9 + §11 dashboards).
- **`ai-guidance/prompts/`:** templates per use-case (course, exercise, quiz, exam).
- **Structured output:** responses validated with zod before use (guards against malformed AI JSON).
- **Recommended provider:** Anthropic Claude (latest tier) — final choice is a flagged decision (§15.3).
- **Depends on:** P0 (config, logger).
- **DoD:** `ai.client` returns a zod-validated structured object for a test prompt; token cost logged;
  a malformed/failed completion surfaces a typed error (not a crash); retry/timeout paths tested.
- **Covers:** §2.5.1 (ai-guidance), foundation for §1.3/§1.6/§1.7, §9 (cost tracking hook), §11 (cost data source).

## Phase 3 — Course Generation (async backbone)

**Goal:** The signature flow — config in, AI-generated Course→Module→Lesson tree out, async.

- **Models:** `Course`, `Module`, `Lesson` (finalize + **indexes** on `userId`, `courseId`, `moduleId`).
- **`course.generator.ts`:** prompt → parse → Course→Module→Lesson tree (uses P2 ai.client + prompts).
- **`course.service.ts`:** create `Course{status:'generating'}`, **enqueue** BullMQ job, return `courseId` immediately.
- **`courseGenerationWorker.ts`:** consume job → generate → persist modules/lessons → set `status: ready|failed`.
- **Status delivery:** `GET /courses/:id` (polling) is baseline; optional **SSE** `GET /courses/:id/events`.
- **Endpoints:** `POST /courses` (onboarding config), `GET /courses/:id`, `GET /courses/:id/structure`
  (tree for React Flow), `GET /courses` (list; free = 1 active enforced here, full entitlement in P8).
- **Depends on:** P1, P2.
- **DoD:** submit config → returns `generating` instantly → worker completes → poll shows `ready` with
  full tree; **failure path sets `failed`** (tested); status-transition unit tests; structure endpoint returns ordered tree.
- **Covers:** §1.2, §1.3, §1.4 (data), §3 (Course/Module/Lesson), §4 (course endpoints), §8 (course-gen queue + status), §14 (course-gen status + async-flow tests).

## Phase 4 — Lessons & Progress

**Goal:** Consume lessons and track progress/streak (feeds gamification + notifications).

- **Model:** `UserLessonProgress` (unique `userId+lessonId`; `status`, `completedAt`).
- **Progress logic:** mark in_progress/completed; **update `User.streak`** (current + lastActivityDate);
  recompute `Course.progressPercent`.
- **Endpoints:** `GET /lessons/:id` (content), `POST /lessons/:id/complete` (or PATCH progress), `GET /progress`.
- **Depends on:** P3.
- **DoD:** open/complete lesson updates progress + streak + course %; idempotent completion; indexes verified.
- **Covers:** §1.5 (content serve), §3 (UserLessonProgress), streak foundation for §10.

## Phase 5 — Assessments: Quiz & Exam

**Goal:** On-demand knowledge checks, lesson-scoped (quiz) and module/course-scoped (exam).

- **Models:** `Quiz`, `QuizSubmission`, `Exam`, `ExamSubmission` (finalize + indexes).
- **`quiz.service`:** AI quiz generation (lesson-scoped). **`exam.service`:** AI exam generation, **scope
  = module | course** (user-selected).
- **`grading.service` (shared):** **rule-based grading for MCQ**, AI grading for short-answer; return
  score + feedback + **correct answers**.
- **Regeneration:** new variant on same topic (rate-limited — enforced in P7).
- **Endpoints:** `POST /lessons/:id/quizzes`, `POST /quizzes/:id/submit`, `POST /modules/:id/exam`,
  `POST /courses/:id/exam`, `POST /exams/:id/submit`.
- **Depends on:** P2, P4.
- **DoD:** generate quiz → submit → graded with correct answers; exam works at both scopes; MCQ graded
  rule-based without an AI call; regenerate returns a fresh variant.
- **Covers:** §1.7, §3 (Quiz/Exam + submissions), §4 (assessment endpoints).

## Phase 6 — Exercises & Grading Orchestration

**Goal:** Generate hands-on tasks and grade submissions (domain-agnostic core; lab execution is P9).

- **Models:** `Exercise` (`taskSpec: {description, starterState, rubric}`, `domain`), `ExerciseSubmission`.
- **`exercise.service`:** AI exercise-spec generation from lesson content + domain.
- **`grading.service`:** AI/rubric grading via **BullMQ grading queue**; status
  `submitted → grading → graded`; writes score + feedback.
- **Endpoints:** `POST /lessons/:id/exercises`, `GET /exercises/:id`, `POST /exercises/:id/submit`.
- **Note:** domain-specific *execution/validation* (run code, match SOC/network answers) plugs in at P9;
  here the generation + submission + async grading pipeline is built and testable with mock submissions.
- **Depends on:** P2, P4.
- **DoD:** generate exercise → submit → async grade → `graded` with score+feedback (tested end-to-end
  with a mock evaluator); status transitions covered by tests.
- **Covers:** §1.6, §3 (Exercise/ExerciseSubmission), §4 (exercise endpoints), §8 (grading queue), §14 (submit→grade test).

## Phase 7 — AI Cost Governance: Usage Quota & Rate Limiting

**Goal:** Stop uncontrolled AI spend before it happens (server-side, per tier).

- **Model:** `UsageQuota` (per user, per period `daily|monthly`, counts per operation, `limits`).
- **`usageQuota.middleware`:** check + increment counts; **runs before `entitlement.middleware`**;
  `429` when exceeded; period reset (lazy on read or via job).
- **`rateLimit.middleware`:** **tier-aware, redis-backed**; applied to auth + **all** AI-generation
  endpoints (course/exercise/quiz/exam/lab).
- **Config:** per-tier limits in `constants` (**placeholder numbers — confirm with Yonatan**).
- **Wire-up:** attach quota + rate-limit to endpoints from P3/P5/P6 (and P9 later).
- **Depends on:** P1 (tier on user), P3/P5/P6 (endpoints to protect).
- **DoD:** exceeding a free-tier quota returns `429` with a clear body; counts reset per period; rate-limit
  headers present; **quota-enforcement unit tests** pass (§14).
- **Covers:** §4 (rate-limit requirement), §7.1 (rate limiting), §9 (quota + cost governance), §14 (quota tests).

## Phase 8 — Subscriptions & Entitlements

**Goal:** Free vs Premium — billing + feature gating.

- **Model:** `Subscription` (Stripe customer/subscription, tier, status, period end).
- **Stripe:** checkout session, **webhook** (sync tier/status), customer portal.
- **`entitlement.middleware`:** gate premium features — multiple simultaneous courses (lift the free
  1-course cap from P3), raised quotas (feed P7 limits), **priority AI queue** for grading/generation,
  extended lab-session caps (consumed in P9).
- **`subscriptionSync.job`:** reconcile Stripe ↔ DB.
- **Endpoints:** `POST /subscriptions/checkout`, `POST /subscriptions/webhook`, `GET /subscriptions/me`.
- **Depends on:** P1, P7.
- **DoD:** upgrade → premium unlocks multi-course + raised quotas; webhook flips tier on payment/cancel;
  premium jobs get queue priority; downgrade re-applies free caps.
- **Covers:** §1.8, §6 (premium set), §7 (subscription), entitlement gating.

## Phase 9 — Domain-Specific Lab Environments (isolated, highest-risk workstream)

**Goal:** Safe sandboxed exercise execution/validation per domain. **Gated on §15.2 infra decision.**
Build lowest-risk → highest-risk. Runs on a **separate worker pool** from the main API (§7.2).

- **9a — Sandbox framework & security baseline:** provider abstraction
  (`SANDBOX_EXECUTION_PROVIDER`: docker-local | firecracker | third-party); **network-isolated,
  CPU/mem/time-limited, ephemeral** containers; no host fs / internal network access; treat all input as untrusted.
- **9b — SOC Simulator (low risk):** `soc.scenarios` data + answer-matching; `GET /labs/soc/scenario/:exerciseId`; submit → validate.
- **9c — Network/SIEM Simulator (low risk):** `network.scenarios` + answer-matching; `GET /labs/network/scenario/:exerciseId`.
- **9d — Code Execution (high risk):** `POST /labs/code/execute` — containerized, language-appropriate, resource-capped.
- **9e — Terminal Simulator (high risk):** `POST /labs/terminal/command` — emulated shell, sandboxed fs/command set.
- **9f — Integration:** wire lab results into P6 exercise submission/grading; enforce lab-session caps by tier (P8).
- **9g — Sandbox security testing:** **breakout attempts in the test suite** (mandatory, §14) — resource
  exhaustion, network egress, fs escape, fork bombs.
- **Depends on:** P6, P8 (session caps); **decision §15.2**.
- **DoD:** each lab launches + validates within limits; workers isolated from API pool; **breakout tests pass**;
  timeouts/OOM handled gracefully; ephemeral teardown verified.
- **Covers:** §2, §2.1, §4 (lab endpoints), §7.1 (sandbox isolation), §7.2 (separate pool), §14 (sandbox security tests).

## Phase 10 — Gamification

**Goal:** Streaks + achievements to drive retention.

- **Models:** `Achievement`, `UserAchievement`.
- **Awarding:** on lesson completion, streak milestones, course completion, assessment pass.
- **`streakReset.job`:** daily reset of streaks for inactivity (timezone-aware).
- **Endpoints:** `GET /gamification/achievements`, `GET /gamification/me`.
- **Depends on:** P4.
- **DoD:** qualifying actions award achievements (idempotent); streak reset job runs; **scheduling tests** (§14).
- **Covers:** §3 (Achievement/UserAchievement), §8 (streak-reset cron).

## Phase 11 — Notifications

**Goal:** Daily nudge for opted-in inactive users; channel-agnostic for future push.

- **Model:** `Notification`; **`sendNotification(userId, type, channel)`** channel-agnostic interface.
- **Channels:** email adapter (SendGrid/Postmark); push adapter **stub** (deferred to mobile phase).
- **Daily cron (per-user, timezone-aware):** if `preferences.dailyNotification` AND no lesson completed
  today (`streak.lastActivityDate`) → send email.
- **Endpoints:** preference read/update (via `PATCH /users/me` from P1) + notification history if needed.
- **Depends on:** P4 (streak/progress), P1 (preferences).
- **DoD:** cron sends email to the right cohort only; switching `channel` routes without refactor;
  **notification-scheduling tests** (§14).
- **Covers:** §10, §13 (email env).

## Phase 12 — Admin / Content Moderation

**Goal:** Inspect + correct bad AI output before real users see it.

- **Auth:** admin role guard (from P1).
- **Endpoints (admin-only):** view/flag/**regenerate** any AI-generated Course/Lesson/Exercise/Quiz;
  **AI cost dashboard** (aggregate UsageQuota + ai.client cost logs across users); manage `Achievement` definitions.
- **Scope:** minimal internal API (a simple internal page can come in the frontend track).
- **Depends on:** P2 (cost data), P3/P5/P6 (content), P10 (achievements).
- **DoD:** admin can list/flag/regenerate flagged content; cost dashboard returns per-user + aggregate spend;
  non-admins are `403`.
- **Covers:** §11, §15.5 (content-QA capability).

## Phase 13 — Data Privacy & Account Deletion

**Goal:** GDPR portability + safe deletion.

- **Endpoints:** `GET /users/me/export` (all user data), `DELETE /users/me` (**soft-delete** + cascade).
- **Cascade + purge:** soft-delete User → cascade Courses/Modules/Lessons/Progress/Submissions/
  UserAchievements/UsageQuota/Subscription; **purge job** hard-deletes after an audit safety window.
- **Depends on:** most models (P1–P10).
- **DoD:** export returns a complete portable dataset; deletion soft-deletes immediately, blocks login,
  and purge job removes data after the window; cascade covered by tests.
- **Covers:** §12.

## Phase 14 — Observability, Performance & Security Hardening

**Goal:** Production-readiness across the whole surface.

- **Observability:** finalize structured logging + request-id; **Sentry**; **metrics** — signups,
  course-gen success/failure rate, exercise/quiz completion rate, **AI cost per user**, lab exec error rate.
- **Performance:** audit **Mongo indexes on all ref fields** (userId/courseId/moduleId/lessonId/exerciseId/quizId);
  verify p95 < 300ms on standard reads; confirm API is **stateless** (horizontal scale); lab pool separated (from P9).
- **Security audit:** HTTPS/TLS at deploy; **validation coverage** on every mutating endpoint;
  **rate-limit + quota coverage** audit; secrets management; dependency scan.
- **Testing/CI:** integration suite for full async flow (trigger→poll→ready) and submit→grade→score;
  wire CI to run typecheck + lint + unit + integration.
- **Depends on:** all.
- **DoD:** dashboards live; index + p95 checks pass; security checklist signed off; CI green on the full suite.
- **Covers:** §7.2, §7.3, §14 (cross-cutting), §15.6 (analytics layer).

---

## Coverage Matrix (every spec section → phase)

| Spec | Topic | Phase(s) |
|---|---|---|
| §0 | Assumptions (gates) | Decisions ↓ (gate P3/P7/P8/P9) |
| §1.1 | Auth | P1 |
| §1.2 | Onboarding config intake | P3 |
| §1.3 | AI course generation | P3 |
| §1.4 | Course structure tree (data) | P3 |
| §1.5 | Lesson consumption | P4 (+P5 quiz, P6 exercise) |
| §1.6 | Exercise flow | P6 (+P9 exec) |
| §1.7 | Quiz/Exam flow | P5 |
| §1.8 | Premium behavior | P8 (+P7) |
| §2 / §2.1 | Domain lab environments | P9 |
| §2.5.1 | Backend folder architecture | P0 (scaffolded) |
| §3 | Data model (all entities) | P1,P3,P4,P5,P6,P7,P8,P10,P11 |
| §4 | API additions | P3,P4,P5,P6,P9 |
| §6 | Premium feature set | P8 (+P7 quotas, P9 lab caps) |
| §7.1 | Security | P0,P1,P7,P9 (+P14 audit) |
| §7.2 | Performance & scalability | P14 (+indexes per phase, P9 pool) |
| §7.3 | Availability & observability | P0 (health), P14 |
| §8 | Async job & queue infra | P0 (setup),P3,P6,P10,P11 |
| §9 | Usage quota & cost governance | P7 (+P2 cost hook) |
| §10 | Notification system | P11 |
| §11 | Admin / moderation | P12 |
| §12 | Data privacy & deletion | P13 |
| §13 | Environment variables | P0 (+per phase) |
| §14 | Testing additions | P3,P6,P7,P9,P10,P11,P14 |
| §15 | Open items | Decisions ↓ |

## Decisions that GATE phases (from §0 + §15 — confirm with Yonatan before starting the phase)

| Decision | Gates | Needed by |
|---|---|---|
| §0 assumptions (Course=path, on-demand gen, free=1 course, etc.) | Whole build | Before P3 |
| §15.3 AI provider + cost model (recommend Claude latest) | P2 | Before P2 |
| §9 / §0 per-tier quota numbers (placeholders in `constants.ts`) | P7 finalization | Before P7 sign-off |
| §15.2 Sandbox execution infra (docker-local / firecracker / 3rd-party) — **needs a spike** | P9 | Before P9 |
| §6 pricing numbers | P8 | Before P8 sign-off |
| Hosting decision (adds Redis dependency) | Deploy | Before P14/deploy |
| §15.5 Content-QA strategy (autonomous vs review pass) | P12 scope | Before public launch |

## Parallelization notes

- **Critical path:** P0 → P1 → P2 → P3 → P4 → P5/P6. Get Milestone A done first.
- After P1, these can proceed in parallel by different engineers: **P7+P8** (governance/billing),
  **P10** (gamification, after P4), **P11** (notifications, after P4).
- **P9 (Labs)** is a standalone parallel workstream — start it after P6 with its own engineer(s);
  it is the highest-effort/highest-risk item and must not block Milestone A.
- **P12/P13** come after the content models exist (P3–P10).
- **P14** is continuous but formally closed at the end.
