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
- ✅ **Phase 8 — Subscriptions & Entitlements** (done: `Subscription` model finalized (unique `userId`, tier/status/stripeCustomerId+index/stripeSubscriptionId/priceId/currentPeriodEnd/cancelAtPeriodEnd, toJSON→id); **provider-agnostic billing seam** (`BillingProvider` interface + `BillingEvent` normalized shape) mirroring the AI-provider pattern — real `StripeBillingProvider` (lazy `stripe` v22 SDK, only instantiated when `STRIPE_SECRET_KEY` present) with `createCheckoutSession`/`createPortalSession`/`constructEvent` (**local signature verification**, no network) + `normalize`/`mapStatus` (Stripe event → normalized), injectable fakes in tests; `subscription.service` — `getOrCreateSubscription` (free default), `createCheckout` (ensures customer, persists `stripeCustomerId`, no-overwrite), `createPortal` (400 w/o customer), **`handleBillingEvent`** (single source of truth: resolves by userId|customerId, upserts on userId, syncs tier+status+billing detail onto **both Subscription AND User.tier** → downgrade re-applies free caps), `processStripeWebhook`; `requirePremium` entitlement middleware (403); **raw-body webhook** carve-out in `app.ts` (`/subscriptions/webhook` bypasses the JSON parser → `express.raw` for signature verification); routes `GET /subscriptions/me`, `POST /subscriptions/checkout`, `POST /subscriptions/portal`, `POST /subscriptions/webhook` (unauthenticated, signature-gated); **priority AI queue** — `jobPriority(tier)` (premium=1 outranks free=10) wired into course-generation + grading enqueue; **24 tests green** — sub CRUD/idempotent + `GET /me` (200/401), checkout url+customer-persist+no-overwrite+404, portal 400/url, `handleBillingEvent` upgrade/downgrade/**past_due-retains-premium**/resolve-by-customerId/billing-detail-persist/no-key→null/no-match→null/ignored, **downgrade re-applies free 1-course cap (integration w/ course.service)**, `processStripeWebhook` service + **HTTP 400 on bad signature** + **HTTP 200 on a genuinely-signed event → tier synced (real signature verification, proves the raw-body carve-out end-to-end)**, `requirePremium` free-403/premium-200, `jobPriority` mapping + **enqueue-priority integration (premium job priority=1, free=10)**, **Stripe `normalize`/`mapStatus` mapping** (checkout/updated/deleted/unknown + all status variants). **Total 140 tests green** (deterministic across repeated full runs), typecheck/lint(0 err)/build clean.
  - **Found + fixed during audit:** (1) `past_due` subscriptions were being demoted to free on the first failed payment — wrong; premium now **retains through the dunning grace period** and only drops on explicit cancel/unpaid. (2) The webhook test only covered the 400 (bad-signature) branch — which passes even if the raw-body carve-out is broken; added a `stripe.webhooks.generateTestHeaderString`-signed **HTTP happy-path** test that verifies exact bytes flow through `express.raw` → real `constructEvent` → `normalize` → tier sync. Also caught a test-infra bug: the suite tripped the auth IP rate-limiter (>20 signups/window) and now clears `rl:*` in `afterEach`.
  - Note: real Stripe checkout/portal need `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID` (tests inject a fake provider; the real `StripeBillingProvider` request path runs only against real keys — webhook signature verification IS exercised via a locally-signed payload). **Known limitation:** quota tier is read from the **JWT** (P7), so raised premium quotas take effect only after a token refresh; the course multi-course gate reads `User.tier` from the DB and applies immediately. `subscriptionSync.job` (Stripe↔DB reconcile) **now implemented in P14** (`reconcileSubscriptions`). Defensive branches left untested (env-gated): missing-priceId→500, missing-webhook-secret→500, getStripe missing-key→500.
- ✅ **Phase 9 — Domain-Specific Lab Environments** (done — highest-risk workstream; §15.2 decision taken: **docker-local** default provider):
  - **9a Sandbox seam + baseline:** provider-agnostic `SandboxProvider` (`labs/sandbox/types.ts`) + `getSandboxProvider()` (docker-local wired; firecracker/third-party → 501); hardened `DockerSandboxProvider` — pure exported `buildDockerArgs` (**`--network none`, `--memory`+`--memory-swap` (swap off), `--cpus`, `--pids-limit`, `--read-only`, `--cap-drop ALL`, `--security-opt no-new-privileges`, `--user 65534:65534` (nobody), `--tmpfs /tmp:...noexec`, `--rm`**) + `run()` (spawns docker, pipes stdin, **output-byte cap**, timeout → `docker rm -f` teardown + SIGKILL, OOM heuristic on exit 137, ephemeral).
  - **9b SOC / 9c Network simulators (low risk, no execution):** static scenario data + shared `scenario.shared.ts` (`evaluateAnswers` normalized/case-insensitive matching, `publicQuestions` **strips expected answers so they never leak**); routes `GET /labs/{soc,network}/scenarios`, `/scenario/:id`, `POST /scenario/:id/submit`.
  - **9d Code execution (high risk):** `executeCode` (language→image/argv map for javascript/python/shell, validates + **code-size cap** + charges the daily **lab quota** BEFORE running, then runs via the sandbox provider); `POST /labs/code/execute` (auth + burst limit + schema).
  - **9e Terminal simulator (high risk → made safe):** **fully in-process emulated shell** over a virtual FS with a strict command whitelist (ls/cd/cat/echo/pwd/whoami/help) — NO child process, NO host FS, `..` clamps at root → host escape/arbitrary execution structurally impossible; `POST /labs/terminal/command`.
  - **9f Integration:** lab-session caps enforced by tier via the P7 `lab` quota (`labExecutionsPerDay` free 100 / premium 5000) charged inside `executeCode`; lab output can ride in exercise `submissionData` for AI grading (free-form).
  - **9g Sandbox security tests (§14, mandatory):** structural hardening-arg assertions **+ LIVE guarded docker breakout tests that actually run** here — network egress blocked (`--network none`), infinite loop killed at timeout (no hang), read-only rootfs write blocked, output-flood capped, trusted-code happy path + teardown, real end-to-end `POST /labs/code/execute`; plus terminal **non-whitelisted-command refusal** (`rm -rf /`, `curl`, `python`, `bash` → not executed) and **path-traversal clamp**, SOC/Network answer-matching + **answer-stripping**, code-exec quota-exhausted 429 (no container launched) + oversize 413 + bad-language 400. **29 lab tests** (live docker tests auto-skip if Docker is absent).
  - **Total 175 tests green** (deterministic across repeated full runs), typecheck/lint(0 err)/build clean.
  - **Fixed during build:** cross-file test flakiness — the shared-Redis IP auth-limiter counter was stomped by parallel files' `rl:*` cleanup; fixed with **serial file execution** (`fileParallelism:false`) + a **global `afterEach` rate-limit-key clear** (`tests/setup.ts`). Suite is now ~42s (serial + real containers).
  - **Fixed during adversarial audit (multi-agent review → 4 confirmed):** (1) **answer-leak** — `evaluateAnswers` returned `expected` for every question, so one throwaway submit harvested all answers; now revealed only for correctly-answered questions (defeats harvesting). (2) **quota not refunded on sandbox launch failure** — `run()` resolves (never throws) on docker-down/bad-image, so a lab unit was burned though nothing ran; added a `launchFailed` signal (spawn 'error' or docker exit 125), `refundQuota`, and a 503. (3) **output cap** now byte-accurate (was UTF-16 code-unit count → up to ~4× the byte budget for multibyte output; decode-once fixes cross-chunk corruption too). (4) **terminal parser** now quote-aware (`echo "a b"`). Added tests for all four + a **live fork-bomb `--pids-limit` containment** test and terminal edge branches.
  - Note: real code execution needs a Docker daemon + the language base images (`alpine`, `node:20-*` cached locally; `python:3.12-slim` would pull on first use). Provider runs on the API host today; **§7.2 dedicated worker-pool isolation is a deploy-topology concern** (documented, not code) — the seam already supports pointing at firecracker/third-party. OOM detection is a 137-exit heuristic (true `OOMKilled` needs inspect, which `--rm` removes).
- ✅ **Phase 10 — Gamification** (done: static `achievement.catalog` (8 achievements: first-lesson, ten-lessons, streak-3/7/30, course-complete, assessment-pass, perfect-score) + idempotent `seedAchievements` (upsert, run at boot); `gamification.service` — `evaluateAndAward` (pure rules → keys) + idempotent `grant` (unique `userId+achievementId` index, dup = benign no-op) + **non-fatal `safeAward`** wrapper (gamification never breaks a core flow), `listAchievements`, `getMyAchievements` (earned + total, populated); **awarding hooks** wired into `completeLesson` (lesson/streak/course-completion) and `submitQuiz`/`submitExam` (assessment pass, ≥70 / 100) — all no-ops when the catalog isn't seeded, so existing suites are unaffected; `streak.service` — tz-aware pure `isStreakStale` (calendar-day diff via `Intl`, invalid-tz→UTC) + `resetStaleStreaks` daily job (zeroes streaks that missed a day, per-user timezone); **BullMQ repeatable `streak-reset` cron** (hourly, idempotent `resetStaleStreaks`) + worker wired into `server.ts` start/stop; `seedAchievements` + `scheduleStreakReset` run at boot; routes `GET /gamification/achievements` (catalog), `GET /gamification/me` (earned + progress); **15 tests green** — seed idempotent, `evaluateAndAward` per-trigger (lesson/streak-threshold/course/assessment-score) + **idempotency**, `getMyAchievements`/`listAchievements`, `isStreakStale` (calendar + **timezone** UTC-vs-America/New_York), `resetStaleStreaks` (stale zeroed / fresh kept / tz), **award hooks end-to-end** (`completeLesson` → first-lesson+course-complete; `submitQuiz` → assessment-pass+perfect-score), endpoints (200 catalog / me / 401). **Total 190 tests green** (deterministic), typecheck/lint(0 err)/build clean.
  - Note: the BullMQ repeatable cron wiring itself isn't unit-tested (job LOGIC `resetStaleStreaks` is, deterministically with injected `now`); `safeAward`'s catch and `resetStaleStreaks` invalid-tz fallback are defensive (untested). Achievement thresholds are code-defined (not admin-editable yet).
- ✅ **Phase 11 — Notifications** (done: **channel-agnostic** delivery seam (§10) — `NotificationChannelAdapter` interface + `EmailChannel` (provider seam: logs when `EMAIL_PROVIDER_API_KEY` unset, real SendGrid/Postmark HTTP call is the documented TODO — no network in dev/test) + `PushChannel` **stub** (logs, deferred to mobile — switching `channel` to 'push' routes cleanly, no refactor) + `getChannel` resolver; `notification.service` — `sendNotification(userId, type, channel, resolveChannel?)` (records a `Notification`, builds from a type→template map, dispatches, marks **sent/failed**, **never throws** so a batch cron survives one failure; channel resolver injectable) + `listNotifications`; `notification.job` — `sendDailyReminders(now?, send?)` (cohort = `preferences.dailyNotification` AND **not active today in the user's timezone**; **per-day idempotent** via last-sent-reminder check; sender injectable); shared tz day-helpers extracted to `common/utils/tz.ts` (`dayNumberInTz`/`sameDayInTz`) and **streak.service refactored to reuse them** (DRY); **BullMQ repeatable `daily-reminder` cron** (hourly, idempotent) + worker wired into `server.ts` start/stop + `scheduleDailyReminders` at boot; route `GET /notifications` (history; preferences stay on `PATCH /users/me` from P1); **10 tests green** — `sendNotification` dispatch+sent / channel-error→failed / missing-user→failed / **channel routing** (push↔email instanceof + push-stub delivers) / **unknown-type template fallback**, cohort selection (opted-in+inactive reminded; opted-out, active-today, and **tz-active-today (America/New_York vs UTC)** skipped), **per-day idempotency** (2nd run sends 0), `GET /notifications` history + 401 + **`id`/no-`_id` shape**. **Total 200 tests green** (deterministic), typecheck/lint(0 err)/build clean.
  - **Fixed during audit:** `Notification` had no `toJSON` transform, so `GET /notifications` leaked `_id`/`__v` (inconsistent with every other model) — added `toJSON`→`id`; added tests for the unknown-type fallback + push-stub send.
  - Note: the real email HTTP send is a provider seam (no SendGrid/Postmark SDK/key wired — tests inject a fake channel, dev/test log-only); the BullMQ cron *wiring* isn't unit-tested (job LOGIC `sendDailyReminders` is, with injected `now`+sender). **Known scale limits (deferred):** the reminder cron loads all opted-in users and does a per-user idempotency query (N+1, unbounded `find`) — fine at current scale, needs batching/pagination later; a persistently-down email provider retries hourly within a day (bounded, creates `failed` records). Notification history is capped at 50; no read/seen state yet.
- ✅ **Phase 12 — Admin / Content Moderation** (done: all routes behind `authenticate + requireRole('admin')` (non-admin → **403**, tested); generic `ContentFlag` model (contentType/contentId/reason/status open|resolved|dismissed/flaggedBy, toJSON→id) — flag any AI content without touching the 4 content models; `admin.service` — **AI cost dashboard** `getCostDashboard` (AiUsage aggregation → total spend/calls/tokens + **per-useCase** + **per-model** + **top-20 per-user** spenders, §11), `listContent` (paginated, cross-user, singular type key), `flagContent`/`listFlags`(status filter)/`resolveFlag` (resolved|dismissed + resolvedAt), **`regenerateContent`** (course → clears module/lesson tree + status→generating + **re-enqueues** courseGeneration; quiz/exercise → re-run their generators, **injectable** for tests; lesson → 400 "regenerate parent course"), `upsertAchievement` (manage achievement definitions, idempotent); routes `GET /admin/costs`, `GET /admin/content/:type`, `POST /admin/content/:type/:id/flag`, `POST /admin/content/:type/:id/regenerate`, `GET /admin/flags`, `POST /admin/flags/:id/resolve`, `POST /admin/achievements` (all zod-validated); **13 tests green** — non-admin 403 / no-token 401, cost aggregation (total+per-useCase+per-model+top-user), list content + unknown-type 400, flag→list→resolve + flag-404 + no-reason 400 + resolve-404, **course regenerate (tree cleared + generating + enqueued)** + quiz regenerate (injected gen → new variant) + lesson-regenerate 400, achievement upsert (create then update, no duplicate), **pagination + non-numeric-param tolerance**, **empty cost dashboard → zeros**. **Total 215 tests green** (deterministic across repeated full runs), typecheck/lint(0 err)/build clean.
  - **Fixed during audit:** `listContent` pagination did `.skip(NaN)` on `?page=abc` (`?? 1` doesn't catch `NaN`); now guarded with `Number.isFinite`. Cleaned up `no-explicit-any` warnings (typed content-model map).
  - Note: quiz/exercise regenerate via HTTP uses the real generators (needs `AI_PROVIDER_API_KEY`; tests inject fakes at the service layer — same pattern as P5/P6); course regenerate **deletes** the existing module/lesson tree (and orphans progress/quizzes/exercises under it) by design — it replaces bad content. No admin audit-log of moderation actions yet.
- ✅ **Phase 13 — Data Privacy & Account Deletion** (done: **GDPR export** `GET /users/me/export` → `exportUserData` gathers a complete portable snapshot across **all** user collections (user, courses, modules, lessons, progress, quizzes+submissions, exams+submissions, exercises+submissions, achievements, usageQuota, subscription, notifications, aiUsage) — content toJSON transforms still apply (passwordHash never serialized, quiz/exam correctAnswer stripped); **soft-delete** `DELETE /users/me` → `softDeleteUser` sets `User.deletedAt` (added to schema, indexed) + **revokes all refresh tokens** (force logout); **login + refresh now block soft-deleted accounts** (login→403, refresh→401); **cascade hard-delete** `deleteAllUserData` removes every owned doc across 15 collections (modules/lessons via the user's courseIds) then the User; **purge job** `purgeDeletedUsers(now?, windowDays?)` hard-deletes accounts soft-deleted beyond the retention window (`ACCOUNT_PURGE_WINDOW_DAYS`, default 30); **BullMQ daily `account-purge` cron** (03:00, idempotent) + worker wired into `server.ts` start/stop; **11 tests green** — export completeness (**all 16 collections incl. exams + all 3 submission types**) + HTTP export (no passwordHash leak) + 401, soft-delete (deletedAt + tokens revoked), **soft-delete idempotent (purge clock not reset on repeat)**, **DELETE /users/me → login 403**, **refresh blocked after delete**, DELETE 401, **cascade delete (user + all owned docs incl. submissions gone)**, **purge window (old purged incl. cascade, recent kept, active users untouched)**. **Total 226 tests green** (deterministic across repeated full runs), typecheck/lint(0 err)/build clean.
  - **Fixed during audit:** `softDeleteUser` was resetting `deletedAt` on repeated calls (pushing back the purge retention clock) — now idempotent (keeps the original deletion time); strengthened export/cascade tests to seed + assert exams and all submission types (previously those branches only ever saw empty sets).
  - Note: cascade is a per-collection `deleteMany` fan-out (not a single Mongo transaction — acceptable, purge is idempotent/re-runnable); the BullMQ cron *wiring* isn't unit-tested (job LOGIC `purgeDeletedUsers` is, with injected `now`+window); `ContentFlag` (admin) is intentionally not user-owned so it's excluded from export/cascade. **Known behaviors (by design):** a soft-deleted user's existing access token stays valid until it expires (≤15 min; stateless JWT — refresh IS blocked, so no renewal), and re-signup with a soft-deleted account's email returns 409 until purge (email retained during the window). No export rate-limit yet.
- ✅ **Phase 14 — Observability, Performance & Security Hardening** (done — final backend phase):
  - **Observability:** structured logging + request-id already on every request (P0); **Sentry seam** (`common/observability/sentry.ts` — `initSentry`/`captureException`, provider-agnostic **no-op without `SENTRY_DSN`**) wired into the error middleware's 500 branch + `initSentry()` at boot; **platform metrics** `GET /admin/metrics` (admin-only) → `getPlatformMetrics` aggregates signups (total/active/premium), **course-gen success/failure rate** (by status, excluding in-flight), quiz/exam submissions, **exercise completion rate**, AI cost/calls (lab exec noted ephemeral).
  - **Performance:** **index audit** — confirmed (and locked with an automated test) that **every ref field is indexed** across all 17 models (userId/courseId/moduleId/lessonId/exerciseId/quizId/examId/…); `ensureIndexes()` at boot (P7) closes the cold-start window; API is **stateless** (JWT, no session) → horizontally scalable.
  - **Security:** signed-off checklist in `docs/SECURITY_CHECKLIST.md` (authN/Z, validation, rate-limit + quota, sandbox isolation, data privacy, headers/CORS, secrets, observability, perf) — ✅ implemented+tested / ⚠️ seam-needs-prod-wiring / ⬜ deploy-time (HTTPS, secret manager, npm audit, load test).
  - **CI:** `.github/workflows/ci.yml` runs typecheck + lint + build + full test suite against Mongo + Redis service containers on push/PR.
  - **`subscriptionSync` reconcile job (§7):** `reconcileSubscriptions` re-fetches each linked subscription's state from the billing provider (`fetchSubscription` added to the seam) and re-applies it (idempotent) — a safety net for missed webhooks; daily `subscription-sync` BullMQ cron + worker wired into `server.ts`. Closes the last P8-deferred item.
  - **8 tests green** — index audit (all ref fields indexed), Sentry no-op safety, metrics aggregation (users/gen-rate/submissions/AI cost) + metrics 403 for non-admin, **reconcileSubscriptions drift-correct / in-sync no-op / unfetchable-skip**. Cleaned 3 dead/deferred stub files (`module.controller`, `module.service`, `streakReset.job`) → **lint 0 warnings, no residual stubs**. **Total 233 tests green** (deterministic across repeated full runs), typecheck/lint(0 warn)/build clean.
  - Note: Sentry DSN + metrics dashboards + HTTPS/TLS + secret manager + `npm audit` + p95 load verification are **deploy-time** (seams/config are in place); the CI workflow isn't executed here (it runs on GitHub push/PR).

---

### ✅ Backend complete — all 15 phases (P0–P14) done. 233 tests green, typecheck/lint(0 warn)/build clean, no residual stubs. Next track: **frontend integration**.

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
