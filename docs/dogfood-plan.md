# Dogfood plan — 20-exercise POC

**Owner:** Jewel Mia  
**Audience:** 5–10 testers (wave 1), then client demo (Yonatan)  
**Prerequisite:** Core loop verified (R1 pass), agent sandbox working (`agt-001` pass)  
**Related:** [qa-runbook.md](./qa-runbook.md) · [user-qa-report.md](./user-qa-report.md) · [published-slugs.json](../apps/api/content/published-slugs.json)

---

## Goal

Validate the **curated 20-exercise POC** with real humans before Phase 3 assessment work:

| Metric | Target (wave 1) |
|---|---|
| Testers invited | 5–10 |
| Complete onboarding + ≥ 3 exercises | ≥ 80% of invitees |
| Rate feedback “helpful” or better | ≥ 70% of completers |
| Blocker bugs | 0 P0 (submit stuck, leak, crash) |

This is **not** the full spec §0.8 bar (20 external / 15 complete ≥ 5). That stays deferred. Wave 1 proves the POC is demo-ready.

---

## Wave 1 — who to invite

| Cohort | Count | Why |
|---|---|---|
| Engineering / product teammates | 2–3 | Can tolerate local setup; file infra bugs |
| AI engineers (not on repo) | 3–5 | Closest to target learner |
| Client stakeholder (Yonatan) | 1 | Demo session, not full dogfood |

**Do not invite** until host checklist below is green.

---

## Host checklist (before sending invites)

Run from **repo root** on the machine testers will hit (your laptop for local dogfood, or staging when deployed).

```bash
# Data stores
docker compose up -d postgres redis sandbox-gateway

# Sandbox image (agent track)
docker build -t labpath-sandbox:local infra/sandbox

# DB seeded (20 published exercises)
npm run prisma:migrate -w @labpath/api
npm run prisma:seed -w @labpath/api

# App stack — api + worker + web
npm run dev
```

| Check | Pass? |
|---|---|
| `GET http://localhost:3001/api/health/ready` → 200 | |
| `GET http://localhost:3000/catalogue` → shows **20 exercises** | |
| Magic-link sign-in works | |
| Onboarding submit → **PASS** | |
| `agt-001-call-the-right-tool` submit → **PASS** + tool trace | |
| Worker running (submits not stuck `queued` >30s) | |

**Pro for contests (optional):** testers need Pro to enter `dogfood-s1`. Either Stripe test checkout at `/billing`, or set tier in DB for dogfood accounts.

Automated gate (optional):

```bash
npm run content:validate -w @labpath/api
SANDBOX_INTEGRATION=1 SANDBOX_ALLOW_RUNC_FALLBACK=true npm run sandbox:smoke -w @labpath/api
```

---

## Tester invite (copy/paste)

**Subject:** LabPath POC — 30 min practice run

> Hi — we're dogfooding LabPath, a graded practice platform for AI engineering (RAG, eval, guardrails, agents, benchmarks).
>
> **Time:** ~30 minutes  
> **URL:** `http://localhost:3000` *(replace with staging URL when deployed)*  
> **Sign-in:** enter your email → magic link (check spam; in dev the link may appear inline)
>
> **Please do:**
> 1. Complete **First solve** (onboarding) — submit the starter config
> 2. Open **Catalogue** → pick one exercise outside RAG (Eval, Guardrails, or Agent)
> 3. Optional: **Paths** → RAG fundamentals (3 steps)
> 4. Fill the feedback form: *(link below)*
>
> **Agent exercises** only work when the host has Docker + sandbox running. If you see `sandbox_runtime_error`, tell us — that's infra, not your code.
>
> Thanks!

---

## 30-minute tester path

| Step | Route | Expected |
|---|---|---|
| 1 | `/onboarding` | First solve → PASS, scorecard visible |
| 2 | `/catalogue` | **20 exercises** badge; filter by track |
| 3 | `/paths` → RAG fundamentals | Step 1 → submit → pass or fail with failing samples |
| 4 | `/exercises/eval-001-write-the-assertion-suite` | Eval scorecard (F1, failing cases) |
| 5 | `/exercises/agt-001-call-the-right-tool` | Agent pass + calculator/json_store in trace |
| 6 | `/progress` | Streak / drill visible |
| 7 | `/contests` → Dogfood Season 1 | Pro only; enter → 2 sampled problems |

### Curated 20 — quick map

| Track | Exercises |
|---|---|
| RAG (5) | chunk, cost ceiling, citation, rerank, python retriever |
| Prompt (1) | JSON contract |
| Eval (3) | assertion suite, judge the judge, catch regression |
| Guardrails (3) | break concierge, indirect payload, hold the line |
| Agent (5) | call right tool, recover & stop, plan sequence, call budget, dedupe & halt |
| Benchmark (3) | two harnesses, same checkpoint decode, eval overlap |

Full slugs: [published-slugs.json](../apps/api/content/published-slugs.json).

---

## Client demo script (~15 min, Yonatan)

**Narrative:** “Graded reps for AI engineers — hidden eval, failure classes, not courses.”

| Min | Show | Talk track |
|---|---|---|
| 0–2 | `/onboarding` → submit starter | First solve in ~2 min; live scorecard |
| 2–5 | `/catalogue` | 20 curated exercises, six simulators; quality over volume |
| 5–8 | `/exercises/grd-001-break-the-concierge` or `/exercises/eval-001-…` | Non-RAG simulator; failing samples name the gap |
| 8–11 | `/exercises/agt-001-call-the-right-tool` → trace | Real sandbox tools; tool log is the proof |
| 11–13 | `/paths` → RAG fundamentals | Guided path, one step at a time |
| 13–15 | `/progress` + `/u/:slug` (if Pro) | Streak, public profile opt-in |

**Defer for now:** proctoring, verified assessments, NN/fine-tune (Phase 3 later).

**FAQ prep:**
- “How many exercises?” → 20 live POC; 160 authored pool for future curation
- “Is this production?” → Inner POC / dogfood; not public launch
- “Proctoring?” → Paused; assessment engine without proctor is next engineering track

---

## Feedback form (copy to Google Form / Notion)

1. Email (optional)
2. Did sign-in and onboarding work? (Yes / No — what broke?)
3. How many exercises did you complete? (0 / 1–2 / 3–5 / 5+)
4. Was the failure feedback helpful? (1–5)
5. Which exercise felt most “real work”? (free text)
6. Which exercise felt broken or confusing? (free text)
7. Would you come back next week? (Yes / Maybe / No)
8. Anything else?

**Internal tracking:** log responses in a sheet with date, exercise slugs attempted, pass/fail, P0/P1 bugs filed.

---

## Bug triage during dogfood

| Severity | Examples | Action |
|---|---|---|
| **P0** | Submit stuck queued, HIDDEN_EVAL in response, auth loop | Stop invites; fix same day |
| **P1** | Sandbox fails for all agent submits, path `nextSlug` wrong | Fix before wave 2 |
| **P2** | UI polish, copy, slow load | Batch after wave 1 |
| **Not a bug** | Free tier 429, contest Pro gate, unpublished slugs 404 | Document in invite |

---

## Exit criteria (wave 1 done)

- [ ] Host checklist green
- [ ] ≥ 5 testers invited
- [ ] ≥ 4 complete onboarding + ≥ 3 exercises
- [ ] ≥ 70% rate feedback ≥ 4/5
- [ ] Client demo delivered (Yonatan)
- [ ] P0 bugs = 0; P1 list triaged
- [ ] Decision: **ready for staged deploy** OR **fix list before wave 2**

---

## After dogfood

| Next engineering track | When |
|---|---|
| Assessment engine (timed, no proctor) | After wave 1 sign-off |
| Signed verify link | After assessment MVP |
| Catalogue 20 → 28 (NN + FT) | Phase 3 Steps 10–11 |
| Proctoring | Paused — [phase-3-decisions.md](./phase-3-decisions.md) |

---

## Open items (non-dogfood)

- [ ] Retake price (€19) — confirm working in billing flow
- [ ] Ten-company hiring outreach list (client)
- [ ] Staging URL for external testers (if not local-only)
