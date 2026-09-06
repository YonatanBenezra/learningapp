# User QA Report — LabPath (Phase 0–2)

**Date:** 2026-09-01  
**Type:** Real-user smoke test (API + web, local)  
**Scope:** Sign-in → onboarding → submit → grade → contests → paths → tiers  
**Related:** [qa-runbook.md](./qa-runbook.md) · [phase-2-signoff.md](./phase-2-signoff.md)

---

## Summary

The core product loop **works** when the API, **grading worker**, and web app are all running. The main user-facing risk is **local/dev setup**: submitting without the grading worker leaves runs stuck in `queued` with no scorecard. Everything else tested (onboarding, tiers, contests, agent exercises, catalogue) behaved as expected once infrastructure was correct.

**Verdict:** Ready for dogfood **after** dev ergonomics fixes (worker + sandbox docs). No blocker bugs found in grading logic or data leakage.

---

## Test environment

| Component | Status during test |
|---|---|
| API (`localhost:3001`) | Running |
| Web (`localhost:3000`) | Running |
| Grading worker | **Missing at first** → started mid-test |
| Postgres / Redis | Up |
| sandbox-gateway | Up |

---

## Problems found

### 1. Critical — Submit hangs without worker

**What happened:** Only the API and web were running; the grading worker was not. After submit, the run stayed **`queued` for ~2 minutes** with no scorecard or trace.

**User impact:** Feels like the app is broken — endless loading, no verdict.

---

### 2. High — Run page does not poll

**What happened:** The `/runs/:id` page fetches **once** on load. If status is `queued` or `running`, it does not auto-update.

**User impact:** Opening a bookmark or shared link looks stuck unless the user refreshes. (The workspace submit flow polls correctly — only the run detail page is affected.)

---

### 3. High — Agent exercises need extra dev setup

**What happened:** Agent A1 (`agt-001`) failed with `sandbox_runtime_unavailable` unless all of the following were in place:

- Grading worker running
- `SANDBOX_ALLOW_RUNC_FALLBACK=true` (no gVisor on the dev machine)
- `docker compose up -d sandbox-gateway`

**User impact:** The Agent track appears broken for devs and teammates without this setup.

---

### 4. Medium — Blank screen during auth check

**What happened:** Protected routes (`RequireAuth`) render **`null` while loading** — a brief white flash before content or login redirect.

**User impact:** Minor polish issue; the app feels unfinished on first paint.

---

### 5. Low — Dev login message unclear

**What happened:** Magic link in dev returns the token inline (good). If the token is missing, the error copy is confusing: *“In local development, the API should also return a token.”*

**User impact:** Dev-only; production unaffected.

---

## What worked

| Area | Result |
|---|---|
| Magic-link sign-in | OK |
| New-user onboarding (R1 starter) | OK — `onboarding.needed: true` |
| R1 submit → grade | **pass** (with worker running) |
| Free tier | Contest **403**; 4th submit **429** |
| Pro tier | Contest enter **201**; 2 sampled problems |
| Agent A1 | **pass** + calculator/json_store trace |
| Guided paths | 2 paths, 3 steps each, clear `nextSlug` |
| Catalogue | **150** exercises, no duplicate slugs |
| Security | No `HIDDEN_EVAL` in grade/trace JSON |
| Web pages | `/`, `/login`, `/catalogue`, `/contests`, `/paths`, `/progress`, `/billing`, `/onboarding`, exercise workspace — all **200** |

Automated gates (same day): `content:validate` 154/154 · e2e **76/76** · typecheck clean.

---

## Solutions

| # | Problem | Recommended fix | Priority | Status |
|---|---|---|---|---|
| 1 | Worker not running | Root `npm run dev` starts **api + worker + web**. Bold warning in README. UI warns if a run stays `queued` >30s. | **P0** | Done |
| 2 | Run page no polling | `RunDetail` polls while `queued`/`running` and loads the grade when ready. | **P1** | Done |
| 3 | Agent dev setup | README + [qa-runbook.md](./qa-runbook.md) + `.env.example`: `sandbox-gateway`, image build, `SANDBOX_ALLOW_RUNC_FALLBACK=true` on worker. | **P1** | Done |
| 4 | Auth blank flash | `RequireAuth` shows `GlobalLoader` while checking the session. | **P2** | Done |
| 5 | Dev login copy | Dev-facing copy: sign-in completes instantly in development. | **P3** | Done |

---

## Action items

- [x] P0: `npm run dev` meta-script + README warning
- [x] P1: Run detail polling
- [x] P1: Sandbox dev prerequisites in docs
- [x] P2: Auth loading state
- [x] P3: Login dev copy

---

## Sign-off

| | |
|---|---|
| **Tester** | Automated + live user smoke |
| **Blockers for dogfood** | None in product logic — **dev setup** must be documented and fixed first |
| **Next step** | Implement P0–P1, then re-run the [qa-runbook.md](./qa-runbook.md) manual walkthrough |
