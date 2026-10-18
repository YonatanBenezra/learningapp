# LeetCode-Style Contests — Phased Plan

**Status:** Draft for implementation kickoff  
**Owner:** Product + Engineering  
**First target season:** `weekly-advanced-1` (15 advanced exercises, 180 min time box)  
**Last updated:** 2026-10-18  

---

## 1. Goal

Deliver a **LeetCode-like contest experience** for LabPath:

- Team **hosts** a season (JSON + deploy, not an in-app contest builder in v1).
- Users **enter** during the global window, get a **personal timer**, solve **graded problems** in contest mode.
- Users see **contest-specific rankings** (score + time), not only the global practice leaderboard.
- **Weekly Contest #1 — Advanced** (`weekly-advanced-1`) is the first production season to validate the flow.

**Non-goals for v1**

- In-app admin CMS (AI topics, cron, email campaigns, proctoring).
- Rating/Elo recalculation tied to contest outcome (optional later).
- Virtual re-play of past contests (Phase 4+).

---

## 2. What we already have (baseline)

| Area | Today |
|------|--------|
| Content | `apps/api/content/contests/*.json` → ingest → `contests` + `contest_problems` |
| API | `GET /contests`, `GET /contests/:slug`, `POST /contests/:slug/enter`, contest exercises & attempts |
| Rules | Global window (`startsAt`/`endsAt`), personal `timeBoxMinutes`, one entry per user, hints disabled in contest |
| Sampling | Seeded shuffle from `pool` → `sampledSlugs` on `ContestEntry` |
| Scoring | Per-problem grade → item score; entry `totalScore`, `elapsedMs`, `finished` / `expired` |
| Web | `/contests`, `/contests/[slug]`, `/contests/[slug]/problems/[exerciseSlug]` |
| Gap | **No per-contest leaderboard**; limited live timer / “contest is live” UX |

Reference implementation: `apps/api/src/modules/contests/contests.service.ts`, `apps/web/src/features/contests/`.

---

## 3. LeetCode parity checklist

| LeetCode behavior | Phase |
|-------------------|--------|
| List upcoming / live / past contests | P1 |
| Enter during window; clock starts on enter | ✅ |
| Fixed problem set for weekly (optional mode) | P2 |
| Points per problem + total / max on scorecard | P2 |
| **Live contest rank table** (score, time, solved count) | **P0** |
| Countdown to start / end; personal time remaining | P1 |
| Virtual contest (practice after close, no rank) | P4 |
| Rating update from contest | Out of scope v1 |

---

## Phase 0 — Align & ship first season (1–3 days)

**Objective:** One hosted season is **publishable and operable** without new product code.

### Tasks

- [x] Confirm `weekly-advanced-1.json` dates, `isPublished`, pool = 15 advanced slugs.
- [x] Automated smoke: `npm run content:smoke-contest-p0 -w @labpath/api` (content + DB).
- [x] Document host runbook (pull, `prisma generate`, `content:sync-catalogue`, `content:seed-core-15`, build, pm2).
- [ ] Smoke test on staging/prod: enter → open problem → submit → entry finishes or expires.
- [x] Fix ops gaps (deploy script `scripts/deploy-prod.sh`, health checks `/api/health/ready`).

### Acceptance

- Any signed-in user can enter while window is **open**.
- All 15 problems reachable under `/contests/weekly-advanced-1/...`.
- Entry closes after 180 minutes or when all problems graded.

### Deliverables

- Runbook section in this doc (§8) validated on VM.
- No code required unless smoke finds bugs.

---

## Phase 1 — Contest UX & visibility (≈1 week)

**Objective:** Feels like a **real contest** before rankings ship.

### 1.1 Web — contest hub

- [x] `/contests`: filter **Upcoming | Live | Past** using API `window` (defaults to Live when open).
- [x] Contest cards: title, dates (UTC), duration, problem count, **Enter** / **Continue** / **View results**.
- [x] Contests hub **“Live now”** banner when `window === open`.

### 1.2 Timers

- [x] **Global window:** “Starts in …” / “Ends in …” on contest detail (+ list cards).
- [x] **Personal time box:** after enter, show **time remaining** (`personalDeadlineAt` from API).
- [x] Contest workspace: sitting countdown bar (submit still blocked by API when expired).

### 1.3 States & copy

- [x] Clear messages: not entered, active, finished, expired (reuse `ContestEntryStatus`).
- [x] Sign-in gate on enter (401 → sign-in link).

### API changes

- [x] `startedAt`, `windowDeadlineAt`, `personalDeadlineAt` on contest detail/list; `clock` on contest exercise payload.

### Acceptance

- User always knows if contest is upcoming, live, or ended, and how much sitting time is left.
- No React regressions on `/contests` or detail (hooks / loading order).

---

## Phase 2 — Per-contest leaderboard (P0 product) (≈1–2 weeks)

**Objective:** **LeetCode-style rank table on the contest page.**

### 2.1 Ranking rules (v1)

1. **Primary:** `totalScore` descending.
2. **Tie-break:** `elapsedMs` ascending (faster sitting wins).
3. **Include rows:** `active`, `finished`, and `expired` entrants (partial scores while in progress).

Partial score for **active** entries:

- `totalScore` = sum of graded items so far (already computed on sync).
- Display **solved / total** (e.g. `7 / 15`).

### 2.2 API

- [x] `GET /api/contests/:slug/leaderboard?page=&pageSize=`
  - Response: `{ items: [{ rank, displayName, totalScore, elapsedMs, solvedCount, totalCount, status }], total, contest: { slug, window } }`
  - Auth: public read for published contest (or signed-in only — decide in implementation).
- [ ] Efficient query on `contest_entries` filtered by `contestId`; index review `(contestId, status, totalScore DESC)`.
- [ ] Privacy: use `publicDisplayName` / profile slug rules (same as global leaderboard).

### 2.3 Web

- [x] Contest detail: **Rankings** section (table; page 1 default).
- [x] Poll every 60s while contest `window === 'open'` (or manual Refresh).
- [x] Highlight **current user** row when signed in.
- [x] Pagination UI when `total > pageSize`.

### Acceptance

- During Core 15 window, two test users with different scores appear in correct order.
- Tie on score breaks by lower `elapsedMs`.
- After entry `expired`, user remains on board with partial score.

---

## Phase 3 — Scoring & sampling polish (≈3–5 days)

**Objective:** Scoreboard reads like LeetCode (**points**, same problems option).

### 3.1 Content schema (contest JSON)

Extend contest JSON (backward compatible defaults):

```json
{
  "samplingMode": "per_user | fixed_pool",
  "pointsPerProblem": 100,
  "rankingIncludesActive": true
}
```

- **`fixed_pool`:** Everyone gets the same ordered list (when `sampleSize === pool.length`, behavior matches today; when smaller, use pool order not shuffle — specify in ingest).
- **`per_user`:** Current seeded shuffle (default).

### 3.2 Scorecard

- [x] `maxScore = sampledCount * pointsPerProblem`
- [x] UI: `totalScore / maxScore` on contest detail and workspace.

### 3.3 Ingest

- [x] `upsert-contests.mjs` → `samplingMode`, `pointsPerProblem`, `rankingIncludesActive` on `Contest`.

### Acceptance

- Core 15 championship uses **fixed_pool** + 15×100 = 1500 max points.
- Documented in `apps/api/content/contests/README.md`.

---

## Phase 4 — Virtual & past contests (optional, ≈1–2 weeks)

- [x] **Virtual:** After `window === 'closed'`, `GET/POST .../virtual/*` — attempts **without** `contestEntryId`.
- [x] Past contest page: final standings + **Virtual practice** grid (`/contests/[slug]/practice/...`).
- [x] Export CSV: `GET /api/contests/:slug/leaderboard/export.csv` (published contests).
- [x] Live contest workspace restored at `/contests/[slug]/problems/...` (was redirecting to `/problems`).

---

## Phase 5 — Integrity & scale (optional)

- Rate limits on contest submissions per minute.
- Worker queue priority for contest grades during live window.
- Caching leaderboard (Redis) if entry count > 1k.

---

## 4. Data model notes (future columns)

Today `Contest` has: `startsAt`, `endsAt`, `timeBoxMinutes`, `sampleSize`, `pool` via `contest_problems`.

| Field | Type | Purpose |
|-------|------|---------|
| `samplingMode` | enum | `per_user` \| `fixed_pool` |
| `pointsPerProblem` | int | default 100 |
| `rankingIncludesActive` | bool | show partial scores on leaderboard |

Migration: `20261018120000_contest_scoring_settings`.

---

## 5. API summary (target end state)

| Method | Path | Phase |
|--------|------|-------|
| GET | `/contests` | ✅ |
| GET | `/contests/:slug` | ✅ (+ `startedAt`, timers P1) |
| POST | `/contests/:slug/enter` | ✅ |
| GET | `/contests/:slug/leaderboard` | **P2** |
| GET | `/contests/:slug/exercises/:exerciseSlug` | ✅ |
| POST | `/contests/:slug/attempts` | ✅ |

---

## 6. Web routes summary

| Route | Phase |
|-------|-------|
| `/contests` | P1 polish |
| `/contests/[slug]` | P1 timers + P2 rankings |
| `/contests/[slug]/problems/[exerciseSlug]` | P1 timer in shell |

---

## 7. Test plan (each phase)

- **E2E:** extend `apps/api/test/contests.e2e-spec.ts` — enter, grade mock, leaderboard order.
- **Web:** manual — two browsers, different pass counts, verify rank.
- **Regression:** practice `/exercises/*` unchanged; hints still off in contest only.

---

## 8. Host runbook (production)

```bash
cd ~/learningapp
git pull --ff-only origin main
npm ci                                    # runs postinstall → prisma generate
npm run prisma:migrate:deploy -w @labpath/api
npm run content:sync-catalogue -w @labpath/api
npm run content:seed-core-15 -w @labpath/api
npm run build:api
cd apps/web && NEXT_PUBLIC_API_URL="/api" npm run build && cd ~/learningapp
pm2 restart api web worker && pm2 save
curl -sS http://127.0.0.1:3001/api/health/ready
```

To **open** a season: set `startsAt` / `endsAt` / `isPublished: true` in JSON, commit, redeploy + seed.

---

## 9. Implementation order (recommended)

1. **Phase 0** — smoke + runbook (today).  
2. **Phase 2** — leaderboard (biggest LeetCode gap; can parallelize API + UI).  
3. **Phase 1** — timers & hub polish (can overlap with P2).  
4. **Phase 3** — fixed pool + points for Core 15 narrative.  
5. Phase 4+ as needed.

---

## 10. Open decisions (resolve before Phase 2 code)

| # | Question | Proposal |
|---|----------|----------|
| 1 | Public leaderboard without login? | Yes for published contests (like LeetCode public board). |
| 2 | Show `active` users on board? | Yes with partial score + “In progress” badge. |
| 3 | Display name source | Same as global leaderboard (`publicDisplayName`). |
| 4 | First season slug | `weekly-advanced-1` |

---

## 11. References

- Contest content: `apps/api/content/contests/`
- Contest service: `apps/api/src/modules/contests/contests.service.ts`
- Sampling: `apps/api/src/modules/contests/contest-sample.ts`
- Scoring: `apps/api/src/modules/contests/contest-score.ts`
- Product direction: hosted JSON seasons (not admin CMS v1)

---

**Next step:** Sign off Phase 0 checklist + open decisions (§10), then start **Phase 2 (leaderboard)** or **Phase 1 (UX)** per priority.
