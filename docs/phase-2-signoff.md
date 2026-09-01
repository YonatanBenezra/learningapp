# Phase 2 sign-off

Engineering sign-off for [phase-2.md](./phase-2.md) Step 12. Product metrics that need live traffic stay as **Phase 1 public-beta** targets — not faked here.

## Exit criteria (spec Part 2)

| Criterion | Status |
|---|---|
| Agent & Tool Use simulator live | **Green** — 25 exercises; A1 go/no-go; workspace + traces |
| Benchmark Playground live | **Green** — 20 exercises; B1–B3 variance/contamination slice |
| Contests running | **Green** — `dogfood-s1`; Pro enter; pool + sample + time box |
| **150** catalogue exercises | **Green** — 25 / 20 / 30 / 30 / 25 / 20 |
| Team-free leaderboard | **Green** — contest rating after window closes |
| ≥ 2 guided paths | **Green** — `rag-fundamentals`, `guardrails-red-team` |

## Catalogue

| Band | Count | Target |
|---|---|---|
| RAG | 25 | 25 |
| Prompt Engineering | 20 | 20 |
| Evaluation | 30 | 30 |
| Guardrails | 30 | 30 |
| Agent & Tool Use | 25 | 25 |
| Benchmark Playground | 20 | 20 |
| **Total (published)** | **150** | **150** |

Contest-only `ctst-*` (4) stay **unpublished** — not in the public catalogue.

CI gates:

- `npm run content:validate` — meta, reference + near-miss, no `HIDDEN_EVAL` in `eval_public.json`
- `content-pipeline.spec.ts` — reference **pass** and near-miss **fail** for every published exercise; grade JSON has no canaries
- Catalogue list dedupes to **latest version per slug**; `pageSize` max **200** for the full set

## Teammate walkthrough (no support)

1. Sign in → `/catalogue` — filter **Agent** → open **A1** (`agt-001-call-the-right-tool`) → submit → scorecard + trace
2. Filter **Benchmark** → open **B1** → pass with `noise` + `ci_overlap`
3. `/paths` → start **RAG fundamentals** or **Guardrails red-team** → continue next unsolved step
4. `/contests` → **Dogfood Season 1** → **Enter** (Pro) → solve sampled problems → scorecard
5. `/leaderboard` — after a contest window closes, board shows contest scores
6. `/u/:slug` — public profile shows `contestRating` when a finished entry exists

Free users: contests show upgrade CTA; hints off on contest attempts.

## Known gaps vs full spec

Deferred by [phase-2-decisions.md](./phase-2-decisions.md) — do not reopen without review:

| Gap | Phase 2 position |
|---|---|
| Firecracker microVM | **Out** — keep gVisor; re-open only if escape review fails |
| Contest paste-pattern telemetry | **Out of v1** |
| Live blended cost dashboard on production traffic | Phase 1 O8 proxy; not re-measured here |
| Neural Network / Fine-tuning simulators | Phase 3 |
| Verified assessments / proctored credential | Phase 3 |
| Year-long contest season ops | Step 10 dogfood window is enough for “running” |

## Phase 3 pointer

When this file’s gates are green, re-spec Phase 3 from [phase.md](./phase.md) before verified assessments or Neural Network / Fine-tuning work.
