# Phase 1 sign-off

Engineering sign-off for [phase-1.md](./phase-1.md) Step 12. Product metrics that need live traffic are recorded as a **beta cohort proxy**, not faked.

## Catalogue

| Band | Count | Target |
|---|---|---|
| RAG | 10 | ~8–10 |
| Prompt Engineering | 10 | ~10–12 |
| Evaluation | 15 | ~15 |
| Guardrails | 15 | ~15 |
| **Total** | **50** | **50** |

RAG+Prompt = 20 (~40%). Eval 15 / Guardrails 15 (~30% each).

CI gates:

- `npm run content:validate` — meta, reference + near-miss files, **no `HIDDEN_EVAL` in `eval_public.json`**
- `content-pipeline.spec.ts` — reference **pass** and near-miss **fail** for every exercise; grade JSON has no canaries

## Beta cohort proxy

Phase 1 exit asked for ≥ 1,000 signups, activation > 40%, D7 > 25%, gross margin positive on Pro.

**Agreed proxy for this inner beta:** the engineering dogfood cohort (this repo’s operators and invited teammates). Public 1,000-signup tracking starts when the invite link is shared; do not treat local magic-link users as that number.

Locked O8 (from [phase-1-decisions.md](./phase-1-decisions.md)): Pro **€24/mo**, fair-use **60 attempts / 30d**, target blend **≤ €0.10**. Margin is positive at those numbers if blend holds. Live blend is not yet measured on production traffic.

Activation and D7 need `POST /api/me/events` (`first_submit` / `first_pass`) plus return visits — hooks exist; dashboards do not.

## Teammate walkthrough (no support)

1. Magic-link sign-in → `/onboarding` (R1 starter, ~3 minutes)
2. Submit → scorecard
3. `/billing` → Pro checkout (test Stripe) or skip if already Pro in dogfood
4. `/progress` → today’s drill + streak
5. Opt in to `/u/:slug` public profile (Pro)

## Known gaps vs spec §0.8

Deferred from inner POC, still not a public-launch bar:

- Verdict stability at 99% of 1,000 re-grades
- Judge κ ≥ 0.70 vs double-annotated labels
- 20 external testers / 15 complete ≥ 5 exercises
- Adversarial grader suite as a ship gate
- Blended cost dashboard on production traffic

## Soft launch

Home badge is **Public beta**. Invite teammates with the app URL; no marketing landing redesign (out of Phase 1).

When this file’s catalogue gates are green, Phase 1 Step 12 is `done`. Phase 2 working plan: [phase-2.md](./phase-2.md). Start at Step 1. Do not begin Agent + Benchmark until kickoff is `done`.
