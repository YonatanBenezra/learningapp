# Backend Security & Hardening Checklist (Phase 14 sign-off)

Status of each cross-cutting control. ✅ = implemented + tested; ⚠️ = seam/config in place, needs prod wiring; ⬜ = deploy-time.

## AuthN / AuthZ
- ✅ JWT access (15m) + refresh (30d) with **rotation + reuse detection** (family revoke) — P1
- ✅ `authenticate` + `requireRole('admin')`; all admin routes 403 for non-admins — P1/P12
- ✅ Passwords bcrypt-hashed; `passwordHash` `select:false` + stripped from every JSON response — P1
- ✅ OAuth (Google) create/link — P1
- ✅ Soft-deleted accounts blocked at login (403) + refresh (401) — P13

## Input validation & injection
- ✅ zod validation on mutating endpoints (auth, courses, quizzes/exams submit, exercises, labs code-exec, admin flag/resolve/achievement, user prefs)
- ✅ Parsed/coerced values replace raw input (NoSQL-injection prevention) — `validate` middleware
- ✅ ObjectId validity checked before lookups where user-supplied

## Rate limiting & cost governance
- ✅ IP fixed-window limiter on auth endpoints (429 + headers) — P1
- ✅ Tier-aware `userRateLimit` + `aiRateLimit` on all AI-generation routes — P7
- ✅ Per-day usage **quota** per tier, race-safe atomic counter — P7
- ✅ Lab-execution quota (charged before run, refunded on launch failure) — P9/P13-audit

## Sandbox / untrusted execution (P9)
- ✅ Docker: `--network none`, memory/cpu/pids caps, `--read-only`, `--cap-drop ALL`, `no-new-privileges`, non-root, ephemeral `--rm`
- ✅ Output-flood byte cap; timeout kill + container teardown
- ✅ Terminal fully emulated (no real shell/FS); command whitelist; path-traversal clamp
- ✅ **Live breakout tests** (network egress blocked, timeout, read-only, fork-bomb pids containment)
- ⬜ Dedicated worker-pool isolation from the API (§7.2) — deploy topology; seam supports firecracker/third-party

## Data protection & privacy (P13)
- ✅ GDPR export (`GET /users/me/export`) — no secret leakage
- ✅ Soft-delete + cascade + scheduled purge after retention window
- ✅ Quiz/exam correct answers stripped before serving; SOC/Network expected answers revealed only when correct

## Transport & headers
- ✅ `helmet` security headers; CORS restricted to `CORS_ORIGIN`
- ⬜ HTTPS/TLS — terminate at the load balancer / ingress (deploy)

## Secrets & config
- ✅ All secrets via env (JWT, AI, Stripe, email, Sentry); zod-validated; prod requires JWT secrets
- ✅ No secrets committed; `.env` not tracked
- ⬜ Secret manager (e.g. AWS Secrets Manager / Vault) — deploy

## Observability (P0/P14)
- ✅ Structured logging (pino) + request-id correlation on every request
- ✅ Sentry error-reporting **seam** wired to the 500 handler (no-op until `SENTRY_DSN` set)
- ✅ Platform metrics endpoint (`GET /admin/metrics`): signups, course-gen success/failure rate, quiz/exercise submissions + completion rate, AI cost/calls
- ⚠️ Metrics dashboards / Sentry DSN — wire real providers at deploy

## Performance & scale
- ✅ Mongo indexes on **all ref fields** (audited by an automated test) — P14
- ✅ `ensureIndexes()` builds indexes before serving traffic (no cold-start window) — P7-audit
- ✅ API is **stateless** (JWT auth, no server session) → horizontally scalable
- ⬜ p95 < 300ms load verification — deploy-time load test

## CI
- ✅ `.github/workflows/ci.yml` runs typecheck + lint + build + full test suite (Mongo + Redis services) on push/PR

## Dependencies
- ⬜ `npm audit` / dependency scanning — wire into CI at deploy hardening
