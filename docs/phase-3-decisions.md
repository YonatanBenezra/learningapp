# Phase 3 — Decision record

Drafted during **Step 1 — Kickoff & decisions** (2026-09-08). Change only via explicit team review before the proctor integration (Step 3) or the first signed result (Step 6).

Source: [LabPath-Specification.md](./Labpath%20specification/LabPath-Specification.md) §5, §8, §12.4; O5 in [phase.md](./phase.md); Phase 1 pricing in [phase-1-decisions.md](./phase-1-decisions.md); Phase 2 locks in [phase-2-decisions.md](./phase-2-decisions.md).

O2, O3, O8 stay as Phase 1 locked. O9 and the Agent / contest locks stay as Phase 2 locked. Do not reopen them here.

**Open in this record:** retake price, proctor vendor (O15). Owners and contract signer locked. Everything else below is locked.

---

## O5 — Who issues the credential

Spec §8 and the O-table scheduled this for Phase 3.

| Field | Decision |
|---|---|
| Issuer | **LabPath-issued.** Signed by us, verifiable against our published key |
| Accreditation partner | **Out of Phase 3.** Re-open only if a paying buyer makes accreditation a condition |
| Claim wording | LabPath asserts *what was solved, under what conditions, on what date* — never "certified engineer". The verification page states the scope explicitly |
| Why | An accreditation partnership is a commercial negotiation with a 10-week phase's worth of lead time on its own. Ship the artefact first; a partner can co-sign a format that already exists |

---

## O10 — Proctoring envelope v1

**Decision: third-party proctor SDK.** Webcam + screen recording through a vendor, not telemetry alone.

| Field | Decision |
|---|---|
| Mode | **Record-and-review (asynchronous).** Recording is captured during the sitting and reviewed after — **not** live human invigilation |
| Live proctoring | **Out of v1.** Per-session cost is several times record-and-review and it forces scheduling; revisit only if a buyer requires it |
| Biometric identity matching | **Out.** No face-match, no ID-document matching. Face-matching is GDPR Art. 9 special-category data and pulls in explicit-consent + DPIA obligations we do not need for v1 |
| Captured | Webcam video, screen recording, session telemetry (start/end, focus loss, submission cadence) |
| Consent | Explicit, before the sitting starts. Refusal means the sitting cannot open — it never blocks ordinary practice |
| Scope | **Assessment sittings only.** No recording on practice attempts, daily drills, or contests. Spec §12.4: do not cripple practice UX chasing the credential |
| Auto-fail | **Never automatic.** A flag opens a human review; only a human revokes (see O12) |
| Retention | Recording deleted **30 days** after the result is issued; **90 days** if a review or dispute is open. Deletion is a job, not a manual chore |
| Data residency | EU. Confirm per vendor in **O15** |
| Fallback | No webcam, or assistive tech that the SDK breaks → documented alternate path. Written before Step 4, not improvised at support time |
| Browser | Vendor lockdown where it exists; do not build our own secure-exam browser |

**Consequence:** this is a **dedicated workstream with a privacy review**, not a ticket inside the assessment engine — same treatment the Agent runtime got in Phase 2 Step 2. It becomes **Step 3** in [phase-3.md](./phase-3.md), and the assessment engine moves to Step 4.

**Required before any recording is captured in production**

- Signed DPA with the vendor
- **DPIA** (GDPR Art. 35 — systematic monitoring of individuals)
- Privacy notice + consent copy reviewed
- Retention/deletion job implemented and tested
- Subject-access and erasure path documented

---

## O11 — Commercial model for a sitting

| Field | Decision |
|---|---|
| Included | **One sitting per Pro subscriber per season** |
| Season | **Quarterly** (4 per year). Aligns with the contest season cadence |
| Retake | **Paid, one-off.** Price is the one number still open below |
| Free tier | Cannot sit. Locked CTA, same shape as contests |
| Fair-use | A sitting does **not** consume the 60 attempts / 30 d practice allowance. It has its own one-per-season gate |
| Employer-paid | **Out of Phase 3.** No employer accounts, no employer billing |

### The margin constraint this creates

Phase 1 locked **Pro €24/mo** against a target blend of **≤ €0.10 per attempt**. A proctored sitting is a different cost class: the vendor charges per session, and that cost lands on top of model spend.

| Field | Position |
|---|---|
| Vendor cost ceiling | **≤ €8 per sitting.** If the shortlist cannot meet this for record-and-review, O10 comes back to the table before Step 3 integration |
| Included cost exposure | 4 sittings/yr × €8 = **€32/yr** against €288/yr Pro revenue (~11%). Acceptable |
| Retake floor | Retake price must be **≥ vendor cost + payment fees + margin** — a retake must never be sold below its own cost |
| Retake working position | **€19 one-off** — pending confirmation |
| Tracking | Sitting cost is recorded per sitting in the existing cost ledger, so the blend stays measurable |

**Still open:** the retake price. Everything else in O11 is locked.

---

## O12 — Signing keys and revocation

| Field | Decision |
|---|---|
| Signature | Detached signature over a **canonical serialisation** of the result (stable field order). Sign the canonical form, never the rendered page |
| Algorithm | Ed25519 |
| Key custody | Private key in the deployment's secret store (Render env), **never** in the repo, logs, migrations, or any client bundle. Managed KMS is out of Phase 3 — we have no cloud-provider dependency to justify it |
| Key id | Every result stores the `key_id` used, so rotation does not invalidate history |
| Rotation | Documented, tested, and exercised once before Step 13. Public keys stay published after retirement |
| Immutability | A result is **immutable once signed**. Corrections are a new result plus a revocation of the old one |
| Revocation | A **state**, never a delete: `revoked_at` + reason code. History is preserved |
| Who revokes | A human, after review. A proctor flag alone never revokes (see O10) |
| Verification output | Three states: **valid**, **revoked** (genuine but withdrawn), **invalid/unknown**. "Revoked" must never render as "missing" |

---

## O13 — Skill decay curve

Spec §8: *"Decays — a skill unpractised for 6 months fades."*

| Field | Decision |
|---|---|
| Curve | Exponential decay on the existing `UserSkillScore.score`, keyed off `lastPracticedAt` |
| Half-life | **180 days** |
| Floor | **0.25 × raw.** A demonstrated skill never reads as zero — it reads as stale |
| Applied to | Radar surfaces: `/progress`, `/u/:slug`, and the verified skill report |
| Not applied to | Leaderboard rank and contest rating — those stay as Phase 2 locked |
| Shown or hidden | **Shown.** Payload carries raw **and** decayed, and the UI names the reason ("last practised 7 months ago") |
| Verified results | A signed result is a **point-in-time claim and never decays.** The radar next to it may |
| Recompute | Derived at read time from `lastPracticedAt` — no cron, no backfill migration, no re-grade |

Constants live in one module so the curve is testable and tunable in one place.

---

## O14 — Catalogue position

**Decision: the curated 20-exercise catalogue is permanent, not a demo gate.**

[published-slugs.json](../apps/api/content/published-slugs.json) (commit `27614bb`, 2026-09-08) restricts ingest to 20 slugs. That selection stays.

| Field | Decision |
|---|---|
| Live catalogue | **Curated.** Quality-selected, not a count race |
| Phase 3 live target | **20 → 28**: add **4 Neural Network** + **4 Fine-tuning** so both new simulators are actually openable |
| Authored library | 150 → **160** (the NN and Fine-tuning slices from Steps 10–11). **Authoring toward 200 is cancelled** |
| Exit metric | Changes from a count to **coverage**: every live simulator has at least one openable exercise, with an Easy and a Medium/Hard in each curated band |
| `asmt-*` / `ctst-*` | Stay unpublished. Unchanged |

### Two things this forces

**1. Phase 2's exit count needs a correction note, not a rewrite.** [phase-2-signoff.md](./phase-2-signoff.md) records "150 published" — true at sign-off, when ingest published all 150. The later curation reduced the live set to 20. Add a dated note to that file so the number is not read as a live claim. Do not edit the original table.

**2. There is now standing content debt.** 130 authored exercises nobody can open still run through `content:validate` and `content-pipeline.spec.ts` on every CI run.

| Option | Position |
|---|---|
| Keep validating all 160 | **Chosen.** They are the pool that curation, contests, and assessment blueprints draw from. CI cost is the price of keeping that pool trustworthy |
| Archive the unpublished set out of CI | Rejected for now — an unvalidated pool is not a pool, it is a folder |
| Revisit | If full-set CI runtime becomes a bottleneck, split it into a nightly job and keep the curated 28 on every push |

---

## O15 — Proctor vendor and data residency

**In progress (Step 3, started 2026-09-13).** Pre-screen complete; outreach pending.

| Field | Requirement |
|---|---|
| Mode | Record-and-review; no live invigilation |
| Cost | **≤ €8 per sitting** (the O11 ceiling) |
| Residency | EU processing and EU storage |
| Contract | DPA, sub-processor list, retention configurable to 30 days |
| Identity | No biometric face-match (O10) |
| Integration | Web SDK; no native app, no desktop installer |
| Accessibility | Documented behaviour with screen readers and without a webcam |
| Exit | Recordings exportable and deletable on termination |

**Shortlist (pre-screen, not yet gated):** PRUEFSTER · Talview EU · Constructor Proctor. Rejected: VigiExam (live-only), AutoProctor (US storage), ProctorU Record+ (EU residency unconfirmed).

Worksheet: [phase-3-proctor-vendor-shortlist.md](./phase-3-proctor-vendor-shortlist.md). Shortlist and price the candidates against this table in Step 3 — do not take a vendor's marketing page as the answer on residency, retention, or price. If nothing meets the €8 ceiling for record-and-review, **O10 reopens** before integration, not after.

---

## Skill slugs for the new simulators

Locked here so no `meta.json` invents a tag (spec §5). Names freeze in Steps 9–11; these slugs do not.

**Neural Network (#7)**

```
training-dynamics
overfitting
model-capacity
hyperparameters
regularisation
```

**Fine-tuning & Adaptation (#8)**

```
tuning-decision
dataset-prep
adapter-methods
tuned-model-eval
```

`cost-engineering`, `evaluation-reading`, and `contamination` already exist on the graph and are reused — do not fork them.

---

## VA1 assessment blueprint

| Field | Decision |
|---|---|
| Draws from | **RAG + Evaluation** — the two most mature harnesses, both with class A gates since Phase 0 |
| Problems | **4**, sampled from an `asmt-*` pool of at least 12 |
| Time box | **90 minutes**, hard |
| Hints | Off |
| Attempts | One per season (O11) |
| Traces | Withheld until the sitting closes |
| Gates | At least one class A gate per problem. No sitting is decided by a judge rating alone |
| Bands | Score thresholds fixed **before** the first real sitting and recorded in the sign-off — never tuned after seeing results |
| Novelty | Pool is never in the public catalogue and never in the daily drill |

---

## Owners

Named 2026-09-11.

| Role | Owner |
|---|---|
| Security / abuse review (Step 3–4) | **Yonatan Benezra** |
| Privacy / DPIA sign-off (Step 3) | **Yonatan Benezra** |
| Vendor contract / DPA signer (Step 3) | **Jewel Mia** |
| Hiring-team track (Steps 1–8, gated at 13) | **Yonatan Benezra** |

**Separation of duties — settled (2026-09-13).** Yonatan Benezra holds security, privacy/DPIA, and hiring track. **Jewel Mia** signs the vendor contract and DPA. The same person must not both commit us to a processor and sign off that the processing is lawful — otherwise the DPIA stops being evidence of anything.

The hiring track's first deliverable is a list of ten target companies — **not yet written.**

---

## Step 1 sequencing

| Track | Next step | Notes |
|---|---|---|
| Skill graph | **Step 2 — Skill graph maturity** | Only current `doing` track. Decay before the report that reads from it |
| Proctoring | Step 3 — Proctor vendor & privacy | Blocked on O15; vendor shortlist can start in parallel with Step 2 |
| Assessment engine | Step 4 | Blocked on Step 3 |
| Simulators | Steps 9–11 | Blocked on the VA1 go/no-go (Step 5) |

**Team agrees:** Step 2 is next. Do not start the assessment engine, the employer view, or Neural Network content from this file.

---

## Implementation constants (for Steps 2–6 and 12)

Source of truth for decay, sittings, and the curated catalogue:

```
SKILL_DECAY_HALF_LIFE_DAYS=180
SKILL_DECAY_FLOOR_RATIO=0.25
SKILL_DECAY_APPLIES_TO=radar,report
ASSESSMENT_PRO_ONLY=true
ASSESSMENT_SITTINGS_PER_SEASON=1
ASSESSMENT_SEASON=quarterly
ASSESSMENT_TIME_BOX_MIN=90
ASSESSMENT_PROBLEMS=4
ASSESSMENT_POOL_MIN=12
ASSESSMENT_HINTS=off
ASSESSMENT_COUNTS_TOWARD_FAIR_USE=false
PROCTOR_MODE=record_and_review
PROCTOR_BIOMETRIC_MATCH=false
PROCTOR_RETENTION_DAYS=30
PROCTOR_RETENTION_DAYS_DISPUTE=90
PROCTOR_COST_CEILING_EUR=8
RESULT_SIGNATURE_ALG=ed25519
PHASE3_CURATED_TARGET=28
PHASE3_AUTHORED_TARGET=160
```

Retake price and `PROCTOR_VENDOR` are deliberately absent — they are the two open items above.
