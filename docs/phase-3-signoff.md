# Phase 3 sign-off

Engineering sign-off for [phase-3.md](./phase-3.md) Step 13. Product and compliance gates that need live traffic, proctoring, or hiring-team participation are recorded honestly — not faked.

**Signed:** 2026-09-15 · **Curated catalogue:** [published-slugs.json](../apps/api/content/published-slugs.json) (**28** live slugs)

---

## Exit criteria (spec Part 2)

| Criterion | Status |
|---|---|
| Verified assessments (VA1 engine, one sitting/season, hints off) | **Green** — assessment kind on contest machine; season gate; e2e |
| LabPath-signed results (Ed25519, tamper-evident payload) | **Green** — auto-issue on finish; scorecard + employer report |
| Public verification (no account) | **Green** — `/verify/[resultId]` + `GET /api/assessments/results/:id/verify` |
| Employer-facing profile + shareable report | **Green** — `/u/:slug`, `/u/:slug/report`, share toggles |
| Neural Network simulator | **Green** — 5 authored, **4 curated** (`nn-001` … `nn-005`; live set in allowlist) |
| Fine-tuning simulator | **Green** — 5 authored, **4 curated** (`ft-001` … `ft-005`; live set in allowlist) |
| Skill decay on radar surfaces (O13) | **Green** — `skill-decay.ts`; raw vs decayed in API + UI |
| Curated catalogue **28** | **Green** — matches `POC_CATALOGUE_TARGET` and ingest allowlist |
| Proctoring (O10 record-and-review) | **Deferred** — Step 3 paused; no recording in production |
| Hiring teams used the report in a loop | **Pending** — template at [phase-3-hiring-reviews.md](./phase-3-hiring-reviews.md); 0/3 reviews logged |

---

## Catalogue (O14)

**Live count:** **28** (curated allowlist). **Authored catalogue library:** **160** (+ unpublished `asmt-*` / `ctst-*` pools).

| Simulator | Curated live | Authored |
|---|---|---|
| RAG | 5 | 25 |
| Prompt Engineering | 1 | 20 |
| Evaluation | 3 | 30 |
| Guardrails | 3 | 30 |
| Agent & Tool Use | 5 | 25 |
| Benchmark Playground | 3 | 20 |
| Neural Network | 4 | 5 |
| Fine-tuning & Adaptation | 4 | 5 |
| **Total** | **28** | **160** |

`published-slugs.json` is the single source of truth for what ingest sets `isPublished: true`. Do not infer live count from disk.

**Curated NN (4):** `nn-001`, `nn-002`, `nn-003`, `nn-005`  
**Curated FT (4):** `ft-001`, `ft-002`, `ft-003`, `ft-004`

---

## CI gates (automated)

| Gate | Command / file | Status |
|---|---|---|
| Meta + canary hygiene (full library) | `npm run content:validate` | **Green** — 176 exercise dirs checked |
| Curated reference / near-miss | `content-pipeline.spec.ts` | **Green** — 28 published slugs |
| NN + FT slices | `nn-content-pipeline.spec.ts`, `ft-content-pipeline.spec.ts` | **Green** |
| Skill decay | `skill-decay.spec.ts` | **Green** |
| Signing + rotation | `result-signer.spec.ts` | **Green** — retired key still verifies |
| Catalogue HTTP | `catalogue.e2e-spec.ts` | **Green** — `GET /api/exercises` → 28 |
| Assessments + signing + employer | `assessments.e2e-spec.ts`, `signed-results.e2e-spec.ts`, `employer-profile.e2e-spec.ts` | **Green** |

**Ops before first deploy:** run `npm run prisma:migrate:deploy` (migrations `20260915170000_signed_assessment_results`, `20260915180000_signed_result_share`).

---

## Teammate walkthrough (no support)

1. Sign in (Pro) → `/assessments` → open **VA1** → **Enter** → solve sampled problems (hints off, time box visible) → finish → scorecard shows **signed result** block with verification link.
2. Copy verification URL → open in a private window (logged out) → `/verify/[resultId]` shows valid/revoked/invalid without learner identifiers.
3. Profile settings → enable public profile → toggle **share** on a verified result → open `/u/:slug/report` logged out → readable band, skills, contest vs practice context.
4. `/catalogue` → filter **Neural Network** → open `nn-001-read-the-learning-curve` → submit reference diagnosis → pass.
5. Filter **Fine-tuning** → open `ft-001-tune-or-prompt` → pass with prompt economics → scorecard shows six-month cost breakdown.

Free users: assessments show Pro upgrade CTA; contests unchanged from Phase 2.

---

## Signing & verification

- **Algorithm:** Ed25519 (O12). Keys via `LABPATH_SIGNING_*` env or dev keyring in non-production.
- **Rotation:** unit-tested — payloads signed with a retired `keyId` still verify when the public key remains in the keyring JSON.
- **Revocation:** admin `POST /api/assessments/results/:id/revoke`; verify endpoint returns `revoked` without deleting the row; signature validity unchanged.

---

## Known gaps vs full spec

Deferred by [phase-3-decisions.md](./phase-3-decisions.md) — do not reopen without review:

| Gap | Phase 3 position |
|---|---|
| Third-party proctoring (O10) | **Paused** — Step 3 not integrated; no consent, recording, retention job, or €8/sitting measurement |
| Retake price (O11) | **Open** — working position €19; not locked in product |
| Skill band rollup + difficulty weighting (O16) | **Open** — decay shipped; taxonomy rollup deferred |
| Live invigilation / biometric match | **Out of v1** (O10) |
| Partner accreditation (O5 flip) | **Out** unless a buyer requires it |
| ≥ 3 hiring-team report reviews | **Pending** — [phase-3-hiring-reviews.md](./phase-3-hiring-reviews.md) |
| Phase 0 external-tester bar (20 testers, κ) | **Carried** — inner POC bar met in Phase 1 breadth; formal Phase 0 Step 13 external round not run |
| Live blended cost on production traffic | Phase 1 O8 proxy; not re-measured here |

---

## Phase 0 Step 13 resolution

Phase 0 inner POC criteria (10 exercises, reference/near-miss, leakage grep, teammate UI pass) were satisfied during Phase 1–2 expansion. The **external** tester round (≥15 of 20, κ ≥ 0.70) was explicitly deferred in [phase-0.md](./phase-0.md) and remains a known gap — not a blocker to Phase 4 planning.

---

## Phase 4 pointer

When this file’s engineering gates are green and hiring-track reviews are recorded (or explicitly waived by product), write the full tutor-marketplace spec (spec §9) before any Phase 4 build. Supply is the hard part: recruit tutors from top-ranked users first.
