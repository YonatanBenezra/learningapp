# Contest feature — remediation phases

Phased plan from the A→Z audit (mock layer, flow splits, API gaps, complexity).  
**Order matters:** later phases assume earlier deliverables unless marked optional.

---

## Phase 0 — Truth & stability (P0, ~2–3 days) ✅ shipped

**Goal:** Arena state matches API after lab solves; no false solved/unsolved UI.

| # | Issue | Work |
|---|--------|------|
| 0.1 | Solved card footer without time | Done: show “Solved” when `scored` but no `solveTime`. |
| 0.2 | Arena not refetching after lab | Done: contest detail refresh on interval + `visibilitychange`. |
| 0.3 | Wrong `problemSlug` on cards | Done: grd-025 / grd-018 split; audit remaining slugs vs pool. |
| 0.4 | HUD fake floors | **Done:** `maxPoints` / `flags` / `totalFlags` / `points` from contest API. |
| 0.5 | `challengeById` ignores API | **Done:** `challengeById(contest, id)` → `buildPlayBoard`. |
| 0.6 | Duplicate `rag-026` on board | **Done:** removed duplicate card; `uniqueChallengeDefs` in `buildPlayBoard`. |

**Exit criteria:** Solve grd-025 in lab → arena card shows Solved + correct title; HUD counts match API; no duplicate slug cards.

---

## Phase 1 — API-driven play board (P0, ~4–5 days) ✅ shipped

**Goal:** Replace `MOCK_PLAY_CHALLENGES` as source of truth for joined operators.

| # | Issue | Work |
|---|--------|------|
| 1.1 | 16 mock cards vs 15 pool | **Done:** `play-board.ts` → `contest.problems[]`. |
| 1.2 | Titles/difficulty mismatch | **Done:** API title/difficulty + `categoryForContestProblem(simulator/slug)`. |
| 1.3 | Static points/solves | **Done:** `pointsPerProblem` base; scored shows `problem.score`; solves `0` until global counts API. |
| 1.4 | `SOLVED_MOCK` / `ATTEMPTED` | **Done:** mock challenge list removed. |
| 1.5 | Drawer wrong RAG copy | **Done:** `getExercise` + `exerciseBriefSnippet` on drawer open. |
| 1.6 | Per-challenge solve time | **Done:** API `solvedElapsedMs`; card `Solved in m:ss`. `scored` = pass only. |

**Exit criteria:** Board list equals `contest.problems`; no mock titles; drawer brief matches exercise `briefMd` snippet.

---

## Phase 2 — Single join & navigation flow (P1, ~2–3 days) ✅ shipped

**Goal:** One mental model: Hub → event → arena/lab; no orphaned routes.

| # | Issue | Work |
|---|--------|------|
| 2.1 | Hub → `/events` vs lobby → `/contests/[slug]` | **Done:** `/contests/[slug]` → `/events/[slug]`; CTAs use `routes.ctfEvent`. |
| 2.2 | Enroll skips lobby | **Done:** `MissionBriefing` on event details + dynamic rules. |
| 2.3 | Route naming | **Done:** README + `contestEventOverview` alias; hub CONTINUE → arena. |
| 2.4 | `ContestDetailView` deprecated | **Done:** removed; `ContestPlayView` / `ContestScoreboardView` only. |

**Exit criteria:** All hub links land on one pre-join page; enter always → `/contests/[slug]/arena`.

---

## Phase 3 — HUD, rails & social proof (P1, ~3 days) ✅ shipped

**Goal:** Right column and header use real data or honest empty states.

| # | Issue | Work |
|---|--------|------|
| 3.1 | Mock activity feed | **Done:** `activityFromLeaderboard`; empty state copy. |
| 3.2 | Around you / rank | **Done:** no mock fallback; rank delta from refresh; empty state. |
| 3.3 | Drawer `MOCK_SOLVES` | **Done:** honest empty solves tab. |
| 3.4 | Fake attachments | **Done:** (Phase 1) section removed. |
| 3.5 | Lobby `operatorCount: 214` | **Done:** `0` until `mergeLeaderboardIntoLobby`. |
| 3.6 | Event-details fake players/teams | **Done:** leaderboard `total`; teams hidden. |

**Exit criteria:** No hardcoded headcounts in join/arena; activity empty state or real rows only.

---

## Phase 4 — Hub & catalog mock hygiene (P2, ~2 days) ✅ shipped

**Goal:** Hub never shows contests that don’t exist in API.

| # | Issue | Work |
|---|--------|------|
| 4.1 | `mergeArenaEvents` injects `MOCK_EVENTS` | **Done:** `listArenaEvents`; API fail → `[]`. |
| 4.2 | Fake operator/registered counts | **Done:** leaderboard `total` enrich; 0 → honest card copy. |
| 4.3 | `mock?.myResult` on closed events | **Done:** `enrichClosedResults` from contest detail. |
| 4.4 | Navbar Teams/Pricing → hub | **Done:** CTF nav shows Events only. |

**Exit criteria:** `useCtfContests` list === API published contests only.

---

## Phase 5 — Scoreboard consolidation (P2, ~2–3 days) ✅ shipped

**Goal:** One scoreboard implementation; delete dead mock paths.

| # | Issue | Work |
|---|--------|------|
| 5.1 | `scoreboard/mock-data.ts` unused | **Done:** deleted. |
| 5.2 | `arena/lib/scoreboard.ts` vs `features/scoreboard/*` | **Done:** legacy arena scoreboard UI removed; route uses `CtfScoreboardPage` only. |
| 5.3 | Chart series | **Done:** `buildSeriesFromLeaderboardItem` only (no mock progression). |
| 5.4 | Profile links for `mock-*` ids | **Done:** `profile-href` guard; API sends `profileSlug` when public. |

**Exit criteria:** Grep `MOCK_TABLE` / `mockFallback` zero hits in app bundle paths.

---

## Phase 6 — Flag UX & scoring clarity (P2, ~1–2 days) ✅ shipped

**Goal:** UI matches “hidden grader” product model.

| # | Issue | Work |
|---|--------|------|
| 6.1 | `FlagSubmit` fake toast | **Done:** info-only “How scoring works”; footer `Open lab` is primary. |
| 6.2 | Scoring closed copy | **Done:** `scoringBannerMessage` / `drawerScoringMessage` / `graderCaptureMessage`. |
| 6.3 | Virtual / practice routes | **Done:** links when `virtualPracticeAvailable` (header + drawer). |

**Exit criteria:** No user belief that manual flag changes score unless backend adds flag endpoint.

---

## Phase 7 — Backend & data model (P1, parallel with 1 & 3) — partial ✅

**Goal:** API supports CTF UI without guesswork.

| # | Issue | Work |
|---|--------|------|
| 7.1 | Per-problem timing on detail | **Done:** `solvedElapsedMs` on detail (Phase 1). |
| 7.2 | Category for filter sidebar | **Done:** API `arenaCategory` + web prefers API over heuristic. |
| 7.3 | Activity / first blood | **Deferred:** needs activity endpoint; arena uses leaderboard snapshot. |
| 7.4 | `contests.service.ts` size | **Deferred:** extract sub-services in a dedicated refactor. |

**Exit criteria:** OpenAPI/types updated; web types in `@/types/contest` match.

---

## Phase 8 — Complexity & legacy cleanup (P3, ~3–4 days)

**Goal:** Maintain one CTF path; assessments stay separate.

| # | Issue | Work |
|---|--------|------|
| 8.1 | `contest-workspace-shell.tsx` god file | **Done:** `useContestExerciseLoader`, `useLabStateToasts`, `useContestOperatorStats`, `useContestCaptureModal`. |
| 8.2 | `ContestView` vs arena | Document: assessments → `ContestView`; CTF → arena only; no cross-import. |
| 8.3 | `OperatorHud`, unused CSS | **Done:** `OperatorHud` removed; legacy `LiveFeedTerminal` mock feed removed. |
| 8.4 | Triple mapper | **Partial:** `mapArenaToCtfEvent` documented as sole hub mapper; full collapse still optional. |
| 8.5 | `arena/play` vs `event-details` CSS tokens | Shared `htb-tokens` only. |

**Exit criteria:** Feature README route map matches code; `npm run typecheck` clean; bundle no dead contest mocks.

---

## Suggested execution order

```text
Phase 0 (finish 0.4–0.6) → Phase 1 + Phase 7 (API timing) in parallel
→ Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 8
```

## Tracking

| Phase | Priority | Est. | Depends on |
|-------|----------|------|------------|
| 0 | P0 | 2–3d | — |
| 1 | P0 | 4–5d | 0 |
| 7 | P1 | 3–4d | — (parallel 1) |
| 2 | P1 | 2–3d | 0 |
| 3 | P1 | 3d | 1, 7 |
| 4 | P2 | 2d | 2 |
| 5 | P2 | 2–3d | 3 |
| 6 | P2 | 1–2d | 1 |
| 8 | P3 | 3–4d | 1–5 |

## Out of scope (later)

- Real team registration, capacity, payments  
- Host-your-event / pricing pages linked from navbar  
- Live websocket activity feed  

Update this file when a phase ships (check items, note PR links).
