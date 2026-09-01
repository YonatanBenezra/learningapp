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

| # | Problem | Recommended fix | Priority |
|---|---|---|---|
| 1 | Worker not running | Add a root `npm run dev` that starts **api + worker + web** together. Bold warning in README: worker is mandatory. Optional: if a run stays `queued` >30s, show *“Grading worker may be offline”* in the UI. | **P0** |
| 2 | Run page no polling | Add interval polling in `RunDetail` for `queued`/`running` (reuse the `waitForRun` pattern from the workspace). | **P1** |
| 3 | Agent dev setup | Update [qa-runbook.md](./qa-runbook.md) + README: require `sandbox-gateway` and `SANDBOX_ALLOW_RUNC_FALLBACK=true` on the worker process. | **P1** |
| 4 | Auth blank flash | Replace `null` in `RequireAuth` with a loading skeleton or “Checking session…”. | **P2** |
| 5 | Dev login copy | In local/dev mode: *“Sign-in completes instantly in development.”* | **P3** |

---

## Action items

- [ ] P0: `npm run dev` meta-script + README warning
- [ ] P1: Run detail polling
- [ ] P1: Sandbox dev prerequisites in docs
- [ ] P2: Auth loading state
- [ ] P3: Login dev copy

---

## Sign-off

| | |
|---|---|
| **Tester** | Automated + live user smoke |
| **Blockers for dogfood** | None in product logic — **dev setup** must be documented and fixed first |
| **Next step** | Implement P0–P1, then re-run the [qa-runbook.md](./qa-runbook.md) manual walkthrough |
