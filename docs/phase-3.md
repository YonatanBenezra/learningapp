# Phase 3 — Credibility

How we build Phase 3. One step at a time. Do not skip ahead. Do not start Phase 4 from this file.

Roadmap of all phases: [phase.md](./phase.md). Product rules: [LabPath-Specification.md](./Labpath%20specification/LabPath-Specification.md) Part 2 and §8. Phase 2 sign-off: [phase-2-signoff.md](./phase-2-signoff.md). Decisions: [phase-3-decisions.md](./phase-3-decisions.md).

**Kind:** credibility — a signed credential an employer trusts, plus the last two simulators. Not tutors, not teams, not institutions.

**Goal:** a learner can sit a proctored, novel, time-boxed assessment with no hints, get a LabPath-signed result, and hand a hiring manager a link that a stranger can verify without an account. Exit: **verified assessments shipped**, **public profiles used by employers**.

**Duration:** ~10 weeks (per spec). O10 picking a proctor vendor makes this the tight end of that range.

**Now:** Step 2 `done` — skill decay shipped. Step 1 stays `doing`: owners, retake price, and the vendor (O15) are still open, and Step 3 cannot start without them. O16 (band rollup) opened by Step 2.

| Status | Meaning |
|---|---|
| `todo` | Not started |
| `doing` | Current step — only one at a time |
| `done` | Accepted; do not reopen unless broken |

---

## Rules

- Finish a step's **Done when** before starting the next.
- **VA1 is the go/no-go.** If one assessment cannot produce a signed, third-party-verifiable result end to end, do not scale the assessment pool and do not start the Neural Network simulator.
- **Proctoring is a dedicated workstream with a privacy review**, not a ticket inside the assessment engine — same bar the Agent runtime got in Phase 2 Step 2. No recording is captured in production before the DPIA and the DPA are signed.
- Hidden eval sets never appear in API responses, traces, errors, leaderboards, contest recaps, **or assessment reports** (carry forward Phase 0–2).
- The assessment problem pool is **never** in the public catalogue — same unpublished rule as Phase 2 `ctst-*`.
- **Recording, telemetry, and one-attempt rules live on the assessment path only.** Practice attempts, daily drills, and contests are untouched. Spec §12.4: design the credential to be cheat-resistant; do not cripple practice UX chasing it.
- A proctor flag never auto-fails and never auto-revokes. A human reviews; a human revokes.
- Neural Network and Fine-tuning grade on **frozen artifacts** — precomputed training curves, checkpoints, and tuned-model eval runs. No GPU training and no live fine-tune jobs in the sandbox. Same rule as Benchmark's frozen fixtures.
- New skill slugs are already locked in [phase-3-decisions.md](./phase-3-decisions.md). Do not invent free-text tags per exercise (spec §5).
- **The live catalogue is curated (O14).** Adding an exercise to `published-slugs.json` is a deliberate act, not a side effect of authoring one.
- The **hiring-team track is non-engineering and runs in parallel from Step 1.** It is not a step, but Step 13 does not pass without it — the credential is worth nothing until someone hires on it.
- Reuse the Phase 0 workspace shell and the Phase 2 contest surfaces. Visual polish is optional and separate from these steps.
- Build only what the current step names.
- Carry forward Phase 1–2 locks: LabPath by Bina, Free 3/week, Pro €24/mo · 60 attempts/30d, gVisor Python sandbox (512 MB / 30 s BYOC, 180 s Agent), contests Pro-only.

## In (Phase 3)

- **Verified assessments** — proctored, novel, time-boxed, no hints, result signed by LabPath (spec §8)
- **Third-party proctoring** (O10) — record-and-review webcam + screen capture, with DPIA, DPA, consent, and a retention job
- **Public verification** — a third party with no account can check that a result is genuine and unrevoked
- **Employer-facing profile view** + shareable verified skill report
- **Neural Network** simulator (#7): architecture, training dynamics, overfitting, hyperparameters
- **Fine-tuning & Adaptation** simulator (#8): tune vs prompt, dataset prep, LoRA, eval of tuned models
- **Skill decay, recency weighting, mature skill graph** (O13 — 180-day half-life, 0.25 floor)
- Curated live catalogue **20 → 28**; authored library **150 → 160** (O14)
- Hiring-team conversations so the score becomes a signal (parallel track)

## Out (defer to later phases)

- Tutor marketplace — Phase 4; its full spec is written at **Phase 3 exit**
- Teams, SSO/SCIM, LTI, team leaderboards, institutional contracts — Phase 5
- **Live human invigilation** and **biometric face matching** — O10 keeps both out of v1
- Authoring toward 200 exercises — **cancelled by O14**; the live catalogue is curated, not counted
- Real GPU training, live LoRA jobs, or model hosting in the sandbox
- Accreditation partnership, unless **O5** flips away from LabPath-issued
- ATS integrations, job board, recruiter search, employer accounts, employer billing
- Year-long contest season ops (still the Phase 2 position)
- Courses, video lessons, marketing landing redesign, i18n, mobile polish

---

## Step list

| Step | Name | Status | Unlocks |
|---|---|---|---|
| 1 | Kickoff & decisions | `doing` | O5, O10–O14 locked; proctoring + signing + decay + curation frozen |
| 2 | Skill graph maturity | `done` | Decay + recency the report can be built on |
| 3 | Proctor vendor & privacy | `todo` | A vendor, a DPA, a DPIA, and a retention job |
| 4 | Assessment engine | `todo` | Sittings: novel sample, hard time box, hints off, one attempt |
| 5 | VA1 + go/no-go | `todo` | First real assessment produces a result |
| 6 | Signed results | `todo` | A result that cannot be forged or edited |
| 7 | Public verification | `todo` | A stranger can check a result without an account |
| 8 | Employer profile + report | `todo` | Something a hiring manager can actually read |
| 9 | Neural Network harness + N1 | `todo` | Seventh simulator; first NN exercise grades |
| 10 | Neural Network slice | `todo` | NN is a simulator, not one exercise |
| 11 | Fine-tuning harness + slice | `todo` | Eighth simulator live |
| 12 | Curated catalogue + content debt | `todo` | 28 openable; both new simulators reachable |
| 13 | Phase 3 sign-off | `todo` | Exit metrics met |

---

## Step 1 — Kickoff & decisions

**Status:** `doing`

**Why first:** What "proctored" means, who signs the credential, and how a skill decays are all expensive to reverse once a single signed result exists in the wild. A credential you re-issue is not a credential.

**Do**

- Lock **O5**: LabPath-issued vs partner-accredited — *done: LabPath-issued*
- Lock **O10**: proctoring envelope — *done: third-party SDK, record-and-review, no biometric match*
- Lock **O11**: commercial model — *done: one sitting per Pro season, paid retake; price open*
- Lock **O12**: signing key custody and revocation policy — *done: Ed25519, secret-store key, revocation as state*
- Lock **O13**: decay curve — *done: 180-day half-life, 0.25 floor, shown not hidden*
- Lock **O14**: catalogue position — *done: curation is permanent; 20 → 28 live, 150 → 160 authored*
- Lock the new skill slugs for both simulators — *done*
- Write the VA1 blueprint (pools, problem count, time box) — *done*
- Write [phase-3-decisions.md](./phase-3-decisions.md) — *done*
- Update [phase.md](./phase.md) "Now" pointer to this file
- Name the owners: security/abuse review, privacy/DPIA sign-off, hiring track
- Confirm the **retake price** (working position €19)
- Start the hiring-team track: list the first ten target companies

**Done when**

- [x] Written decision record for O5, O10, O11, O12, O13, O14
- [x] Skill slugs and VA1 blueprint frozen before any content exists
- [x] `phase.md` "Now" pointer updated
- [ ] Security / abuse review owner named for Steps 3–4
- [ ] Privacy / DPIA owner named — not the same person who signs the vendor contract
- [ ] Retake price confirmed
- [ ] Hiring-track owner named and first outreach list written
- [ ] Team agrees Step 2 is next (skill graph before the report that reads from it)

**Record:** [phase-3-decisions.md](./phase-3-decisions.md)

**Do not:** Assessment code, signing keys in production, NN content, employer UI, or a vendor contract before O15 is priced against the €8 ceiling.

---

## Step 2 — Skill graph maturity

**Status:** `done`

**Why:** The verified report is a claim about a person's skills at a point in time. Ship decay first or every issued credential changes meaning the moment decay lands. `UserSkillScore.lastPracticedAt` already exists and is written by [grading.pipeline.ts](../apps/api/src/modules/grading/pipeline/grading.pipeline.ts) — nothing reads it yet.

**Do**

- Implement the **O13** curve as a pure, tested function: 180-day half-life, 0.25 floor, difficulty and recency weighted (spec §8)
- Derive at read time from `lastPracticedAt` — no cron, no backfill migration, no re-grade
- Return both **raw** and **decayed** so the UI can explain the difference
- Radar on `/progress` and `/u/:slug` shows the decayed score and names the reason ("last practised 7 months ago")
- Mature the graph: skill nodes get a parent band, so a report can roll up per simulator instead of listing leaf tags
- Leaderboard rank and contest rating stay **unchanged** (O13)

**Done when**

- [x] Decay is a unit-tested pure function with the O13 constants in one module
- [x] A skill unpractised past the half-life visibly fades, and never reads as zero
- [x] Practising it again restores the score without a re-grade
- [x] Raw vs decayed is distinguishable in the API payload
- [x] Existing leaderboard, profile, and progress tests still pass

**Shipped:** `src/modules/skills/skill-decay.ts` — 180-day half-life, 0.25 floor, read-time derivation, null and future-date safe · `skill-decay.spec.ts` (11 cases) · `toSkillScoreView` replaces the duplicated radar mapper in `profiles.service.ts` and `progress.service.ts` · payload now carries `score` (decayed), `rawScore`, `daysSincePractice`, `stale` · web `SkillScore` type + `skill-freshness.ts` · `skills-table.tsx` and `public-profile.tsx` name the reason and show the earned score as a ghost bar · no migration, no cron, no backfill · leaderboard and contest rating untouched

**Deferred, with reasons:**

- **Band rollup not done → O16.** All 35 skill rows are roots (`parentId` is null everywhere), and `Skill.parent` is a *single*-parent tree. `cost-engineering`, `evaluation-reading`, `contamination`, and `planning` each belong to more than one simulator, so a single-parent taxonomy cannot express them. Two candidate designs are recorded in O16; do not invent a 35-skill mapping without picking one.
- **Difficulty weighting not done.** Spec §8 wants the radar weighted by difficulty *and* recency. Recency now works; difficulty does not, because `grading.pipeline.ts` writes `score` as `passed ? 1 : 0` — the row does not record which exercise difficulty earned it. Retrofitting needs either a write-time change plus a re-grade (**O13 forbids the re-grade**) or a different read-time source. Folded into O16.

**Do not:** Change the contest rating formula; hide practice history; expose `lastPracticedAt` for users who never opted into a public profile.

---

## Step 3 — Proctor vendor & privacy

**Status:** `todo`

**Why:** O10 chose a third-party SDK, which means webcam and screen recordings of identifiable people. That is a compliance workstream before it is an integration, and it gates everything downstream. Phase 2 gave the Agent runtime the same standalone treatment for the same reason.

**Do**

- Resolve **O15**: shortlist vendors against the requirement table — record-and-review, **≤ €8 per sitting**, EU processing and storage, 30-day configurable retention, web SDK, no biometric match, documented accessibility. Verify residency, retention, and price against the contract, not the marketing page
- If nothing meets the €8 ceiling for record-and-review, **stop and reopen O10** — do not integrate and hope
- Sign the **DPA**; record the sub-processor list
- Complete the **DPIA** (GDPR Art. 35 — systematic monitoring). Privacy owner signs, and it is not the person who signed the contract
- Consent flow: explicit, before the sitting opens, with plain-language copy on what is captured, who reviews it, and when it is deleted
- Retention job: delete at **30 days** after issue, **90** while a review or dispute is open. A tested job, not a manual chore
- Subject rights: access and erasure paths documented and reachable by support
- Fallback path written for no-webcam and assistive-tech cases
- Review workflow: an admin surface where a flagged sitting can be watched and dispositioned. Flags never auto-fail
- Abuse review with the security owner: what a determined cheater still gets, and what this envelope actually costs them

**Done when**

- [ ] Vendor chosen and priced inside the €8 ceiling, in writing
- [ ] DPA signed; DPIA completed and signed by the privacy owner
- [ ] Consent copy reviewed; refusal blocks the sitting and nothing else
- [ ] Retention + deletion job implemented and tested at both windows
- [ ] Recording is captured on a sitting **only** — never on practice, drills, or contests
- [ ] Admin review surface exists; no automatic fail or revoke path exists
- [ ] Accessibility fallback documented before any learner meets it
- [ ] Abuse review recorded

**Do not:** Live invigilation; face-matching or ID-document matching; storing recordings outside the EU; building a secure-exam browser; wiring recording into ordinary attempts "for consistency".

---

## Step 4 — Assessment engine

**Status:** `todo`

**Why:** Spec §8 — proctored, novel, time-boxed, no hints. Phase 2 contests already do window, pool, per-user sample, and hints-off. An assessment is that machine with a harder envelope and a single attempt, so extend it rather than inventing a parallel one.

**Do**

- Assessment object per the VA1 blueprint: pools, **4** problems, **90-minute** hard time box, **one** sitting per Pro season
- Entitlement: Pro-only; one per season; a sitting does **not** consume the 60/30 d practice allowance (O11)
- Novel pool: `asmt-*` exercises stay `isPublished: false` — never in the public catalogue, never in the daily drill
- Per-user sample with a recorded `sample_seed`, as contests do
- Hints **off**; traces withheld until the sitting closes
- Wire the Step 3 consent gate and recording session into sitting open/close
- Abandon and timeout are explicit terminal states, not a stuck row
- Record the per-sitting vendor cost in the existing cost ledger so the blend stays measurable (O11)

**Done when**

- [ ] A sitting opens only after consent, runs under the time box, and closes on submit or timeout
- [ ] Second sitting in the same season is refused with a clear message
- [ ] Free user cannot open a sitting (clear upgrade message)
- [ ] Hidden pool and canaries never appear in API, trace, or telemetry payloads
- [ ] Recording session id is bound to the sitting and is not exposed to the learner's public surfaces
- [ ] Sitting cost lands in the cost ledger

**Do not:** Sign anything yet; build the employer view; apply assessment telemetry or recording to ordinary practice attempts.

---

## Step 5 — VA1 + go/no-go

**Status:** `todo`

**Why:** Same shape as R1 / P1 / A1 / B1 — one playable artefact is the gate. If VA1 cannot be sat and scored, nothing downstream is worth building.

**Do**

- Author the **VA1** pool: **≥ 12** `asmt-*` items across RAG + Evaluation, at least one class A gate per item
- Fix the band thresholds **before** the first real sitting and record them — never tune after seeing results
- Result object: per-item verdicts, per-skill rollup, band, sitting metadata (window, duration, sample seed) — **no hidden eval, no canaries**
- Scorecard the learner sees at close; the report artefact comes in Step 8
- Reference sitting passes; a near-miss sitting lands below the band boundary — both in tests
- One teammate sits VA1 end to end, with consent and recording live, no support

**Done when**

- [ ] VA1 sittable via HTTP and in the UI (open → sit → submit → result)
- [ ] Reference passes; near-miss fails at the documented band boundary
- [ ] Leakage grep clean on the `asmt-*` slugs
- [ ] Result payload is public-safe before any signing exists
- [ ] Bands recorded before the first real sitting
- [ ] Teammate finishes a sitting without support

**Do not:** Scale the pool past VA1's 12; start Neural Network; publish `asmt-*` into the catalogue; promise a credential in the UI before Step 6.

---

## Step 6 — Signed results

**Status:** `todo`

**Why:** Spec §8 — "results signed by LabPath". An unsigned JSON blob is a screenshot, not a credential.

**Do**

- Canonical serialisation of the result (stable field order) — sign the canonical form, not the rendered page
- **Ed25519**, private key in the deployment secret store per **O12**; never in the repo, logs, migrations, or a client bundle
- Store `signature`, `key_id`, `issued_at`; results become **immutable** once signed
- Revocation as a **state**: `revoked_at` + reason code, set by a human after review (never by a proctor flag)
- Key rotation: documented, tested, exercised once before Step 13; retired public keys stay published
- Tests: tampered field fails; rotated key still verifies old results; revoked result verifies as *genuine but revoked*

**Done when**

- [ ] A signed result verifies against the published key
- [ ] Any edited field fails verification
- [ ] Revocation is representable and does not delete history
- [ ] Rotation documented and exercised
- [ ] No key material in the repo, logs, or client bundle
- [ ] Corrections are a new result plus a revocation, never an edit

**Do not:** Roll custom crypto; sign anything that embeds hidden eval; make revocation a hard delete; let an automated flag revoke.

---

## Step 7 — Public verification

**Status:** `todo`

**Why:** Exit says employers use the profile. An employer will not sign up to check a candidate. Verification has to work for a stranger.

**Do**

- Public route (working position `/verify/:resultId`) — no account, no cookie
- Three states, distinctly rendered: **valid**, **revoked** (genuine but withdrawn), **invalid/unknown**
- Shows: issued-at, band, per-skill rollup, sitting conditions (proctored, time-boxed, no hints), and the `key_id`
- Publish the verification key at a stable path so a third party can check offline
- Rate limit and cache; the result id is a bearer token in practice, so it must be unguessable and revocable
- Copy is explicit about scope: what LabPath asserts and what it does not (O5)
- Leakage: no email, no user id, no traces, no hidden eval, **no recording, no telemetry**

**Done when**

- [ ] A logged-out stranger can verify a real result
- [ ] A tampered or unknown id is rejected without leaking whether the user exists
- [ ] Revoked results render as revoked, never as missing
- [ ] Offline verification against the published key is documented and reproducible
- [ ] Rate limit covers enumeration
- [ ] Recording and telemetry are unreachable from this surface

**Do not:** Require signup to verify; expose practice history here; publish any recording; put PII on the page beyond the display name the learner opted into.

---

## Step 8 — Employer profile + report

**Status:** `todo`

**Why:** Spec Phase 3 — employer-facing profile view and a shareable verified skill report. The public profile from Phase 1 is learner-facing; a hiring manager needs a different read.

**Do**

- Employer view of `/u/:slug`: verified results first, then decayed radar, then practice depth — solves and streaks are supporting evidence, not the headline
- Shareable **verified skill report**: one link, one page, printable, carrying the Step 7 verification link
- A signed result is a point-in-time claim and **does not decay**; the radar beside it may. Say so on the page (O13)
- Learner controls what is shared, per result, and can revoke a share; nothing on a public surface without opt-in (carry forward the Phase 1 rule)
- Contest rating and verified band sit side by side, clearly distinguished — one is competitive, one is assessed
- Hiring track: at least three hiring teams read a real report and record what was missing
- Feed that feedback into the report layout before Step 13

**Done when**

- [ ] A learner can share a verified report link and revoke that share
- [ ] Employer view shows nothing the learner did not opt into
- [ ] Report renders correctly with zero verified results (no broken empty state)
- [ ] Decay vs point-in-time distinction is legible to someone who has never used LabPath
- [ ] ≥ 3 hiring-team reviews recorded with their objections
- [ ] Leakage tests cover the employer payload

**Do not:** Build recruiter search, ATS export, or employer accounts; sell to employers this phase; auto-publish anyone's results.

---

## Step 9 — Neural Network harness + N1

**Status:** `todo`

**Do only after Step 5 is done** (VA1 go/no-go). The credential is the phase; simulators do not start while it is unproven.

**Why:** Spec #6 simulator table — NN is intuition: architecture, training dynamics, overfitting, hyperparameters. Med build cost, medium adjacent breadth.

**Do**

- Add `neural_network` simulator module + harness folder (the enum value already exists in the Prisma schema — no migration)
- **Frozen artifacts only**: precomputed training curves, loss/accuracy per epoch, hyperparameter sweeps. No training at grade time
- Submission is a **diagnosis or a config**, not arbitrary code: which run overfits, which knob explains the gap, what to change next
- Seed **N1** (`nn-001-…`) with public + hidden eval; pass is class A on the named failure mode, not a judge rating
- Skills come from the locked slugs — `training-dynamics`, `overfitting`, `model-capacity`, `hyperparameters`, `regularisation`
- Authoring template under `content/templates/neural-network/`
- Workspace plays it with the existing shell

**Done when**

- [ ] N1 playable end to end via HTTP and in the UI
- [ ] Reference passes; near-miss (right verdict, wrong reason) fails
- [ ] Hidden canaries never in grade, trace, or API JSON
- [ ] No GPU, no training job, no model download at grade time
- [ ] `content:validate` and `content-pipeline.spec.ts` cover the new simulator

**Do not:** Real training runs; Fine-tuning; a full NN catalogue; teaching material — this is a lab, not a course. Do not add N1 to `published-slugs.json` yet (Step 12 curates).

---

## Step 10 — Neural Network slice

**Status:** `todo`

**Why:** One exercise is a POC. Same bar as Phase 2 Step 5 for Agent.

**Do**

- Author **≥ 5** NN exercises including N1, covering training dynamics, overfitting, capacity/architecture, and hyperparameter reasoning
- Each has reference pass + near-miss fail
- Mix includes at least one Easy and one Medium/Hard — the curated four in Step 12 are chosen from this slice
- No new skill slugs

**Done when**

- [ ] ≥ 5 NN exercises authored and gradable
- [ ] Reference / near-miss / leakage tests pass on all of them
- [ ] Difficulty spread recorded in the checklist below

**Do not:** Jump to 25 NN exercises — O14 cancelled the count race; start Fine-tuning; add live training.

---

## Step 11 — Fine-tuning harness + slice

**Status:** `todo`

**Why:** Spec #8 — when to tune vs prompt, dataset prep, LoRA, eval of tuned models. High build cost, so it comes last of the simulators and reuses everything above.

**Do**

- Add `fine_tuning` simulator module + harness folder (enum value already in the schema)
- **Frozen artifacts only**: precomputed tuned-model eval runs, base-vs-tuned comparisons, dataset samples with planted defects. No LoRA job at grade time
- Three exercise shapes: the **tune-vs-prompt decision** (with cost), **dataset prep** (dedupe, leakage, label noise, format), and **eval of a tuned model** (real improvement, or Benchmark-style noise)
- Seed **F1** first as this simulator's go/no-go, then author to **≥ 5** including F1
- Skills from the locked slugs — `tuning-decision`, `dataset-prep`, `adapter-methods`, `tuned-model-eval`
- Reuse the Benchmark variance machinery for the eval-of-tuned-model shape rather than duplicating it
- Template under `content/templates/fine-tuning/`

**Done when**

- [ ] F1 playable end to end; reference passes, near-miss fails
- [ ] ≥ 5 Fine-tuning exercises authored and gradable
- [ ] At least one of each of the three shapes shipped
- [ ] Cost reasoning appears on at least one scorecard — tune vs prompt is an economics question
- [ ] Leakage clean; no training or model download at grade time

**Do not:** Host or serve a tuned model; accept dataset uploads from learners; build a labelling tool.

---

## Step 12 — Curated catalogue + content debt

**Status:** `todo`

**Why:** O14 made curation permanent, so this step is a selection, not an authoring binge. Two new simulators exist in the enum and on disk; if nothing from them reaches `published-slugs.json`, nobody can open them and "8 simulators live" is a lie.

**Do**

- Add **4 Neural Network** + **4 Fine-tuning** slugs to [published-slugs.json](../apps/api/content/published-slugs.json) — curated **20 → 28**
- Selection rule per band: at least one Easy and one Medium/Hard; prefer exercises whose failure feedback names a class, not just a verdict
- Verify the number the API actually publishes matches the number in this file — the Phase 2 lesson: an exit count that ingest does not honour is not a count
- Add a dated correction note to [phase-2-signoff.md](./phase-2-signoff.md): 150 was live at sign-off; curation later reduced the live set to 20. **Do not edit the original table** — annotate it
- Content debt (O14): keep all **160** authored exercises under `content:validate` + `content-pipeline.spec.ts`. If full-set CI becomes a bottleneck, split — curated 28 on every push, full set nightly
- `asmt-*` and `ctst-*` stay unpublished

**Done when**

- [ ] Curated catalogue is **28**, and `GET /api/exercises` returns 28
- [ ] Every live simulator has at least one openable exercise, with an Easy and a Medium/Hard where the band has ≥ 2
- [ ] All 160 authored exercises pass reference / near-miss / leakage CI
- [ ] Phase 2 sign-off carries the dated correction note
- [ ] `published-slugs.json` position is stated in the Phase 3 sign-off, not left implicit

**Do not:** Mix assessment or contest pools into the public catalogue; count authored-but-unpublished exercises as live; quietly re-publish the other 132 to make a number look better.

---

## Step 13 — Phase 3 sign-off

**Status:** `todo`

**Why:** Phase 3 exit gate from spec Part 2 and [phase.md](./phase.md).

**Do**

- Confirm a full sitting works in the UI: consent → time box → submit → signed result → public verification link
- Confirm the employer report is readable by someone who has never seen LabPath
- Confirm both new simulators are openable from the curated catalogue, not only over HTTP
- Confirm the retention job actually deleted a recording at 30 days
- Exercise key rotation once, and verify an older result still validates
- Teammate walkthrough with no support: sit VA1 → get the signed result → verify it logged out → share the report
- Record the hiring-track outcome honestly — conversations held, objections raised, whether anyone used it in a hiring loop
- Record the measured per-sitting cost against the €8 ceiling and the retake price
- Document known gaps vs full spec in `phase-3-signoff.md` (live invigilation, accreditation, live cost blend, the external-tester bar carried since Phase 0)
- Do not fake employer adoption; a review is not a hire

**Done when**

- [ ] Verified assessments shipped: sittings, proctoring, signing, public verification, revocation
- [ ] Employer profile + shareable verified report live behind learner opt-in
- [ ] Neural Network live (≥ 5 authored, 4 curated) and Fine-tuning live (≥ 5 authored, 4 curated)
- [ ] Skill decay applied and explained on radar surfaces
- [ ] Curated catalogue 28, matching what ingest publishes; full authored set green in CI
- [ ] Retention deletion and key rotation both demonstrated, not just documented
- [ ] Measured sitting cost inside the €8 ceiling, or the overrun recorded with a decision
- [ ] ≥ 3 hiring teams reviewed a real report; outcome recorded either way
- [ ] Teammate completes the walkthrough without support
- [ ] Sign-off file written
- [ ] Phase 0 Step 13 status resolved rather than left `todo` for a fourth phase

**Do not:** Start the tutor marketplace build; open teams or institutional work; carry an unresolved signing, revocation, or retention gap into Phase 4.

---

## Open decisions (Phase 3)

| ID | Decision | When | Position |
|---|---|---|---|
| O5 | Verified assessments LabPath-issued vs partner-accredited | Step 1 | **Locked:** LabPath-issued; accreditation only if a buyer requires it — [phase-3-decisions.md](./phase-3-decisions.md) |
| O10 | Proctoring envelope v1 | Step 1 | **Locked:** third-party SDK, **record-and-review**, no biometric match, 30-day retention, assessment path only |
| O11 | Commercial model for a sitting | Step 1 | **Locked:** one sitting per Pro season (quarterly), paid retake, outside the 60/30 d allowance. **Retake price still open** |
| O12 | Signing key custody + revocation | Step 1 | **Locked:** Ed25519, key in the deployment secret store, rotatable, revocation is a state |
| O13 | Skill decay curve | Step 1 | **Locked:** 180-day half-life, 0.25 floor, radar + report only, shown not hidden |
| O14 | Catalogue position | Step 1 | **Locked:** curation is permanent — live 20 → **28**, authored 150 → **160**, authoring to 200 cancelled |
| O15 | Proctor vendor + data residency | **Step 3** | **Open:** record-and-review, ≤ **€8**/sitting, EU processing and storage, web SDK, no biometric match. If nothing qualifies, **O10 reopens** |
| O16 | Skill band rollup + difficulty weighting | **Step 8** (before the report ships) | **Open.** Rollup option A: populate `Skill.parentId` with six band nodes — needs a 35-skill mapping and forces one band per skill. Option B: derive the band from `ExerciseSkill → Exercise.simulator`, which needs no taxonomy and lets a skill sit under several bands. Difficulty weighting rides along: it needs a score source that records difficulty |
| — | Retake price | Step 1 | **Open:** working position **€19** one-off; floor is vendor cost + fees + margin |
| — | Owners: security/abuse, privacy/DPIA, hiring track | Step 1 | **Open:** name at kickoff. Privacy sign-off ≠ contract signer |

O2, O3, O8 stay as Phase 1 locked. O9 and the Agent / contest locks stay as Phase 2 locked. Do not reopen them here.

---

## Exercise checklist (fill during Steps 5, 9–12)

Two numbers now, not one — **authored** is the validated library, **curated** is what a learner can open (O14).

| Band | Authored (P2) | Authored (P3) | Curated now | Curated target | Simulators |
|---|---|---|---|---|---|
| RAG | 25 | 25 | 5 | 5 | RAG |
| Prompt | 20 | 20 | 1 | 1 | Prompt Engineering |
| Eval | 30 | 30 | 3 | 3 | Evaluation |
| Guardrails | 30 | 30 | 3 | 3 | Guardrails |
| Agent | 25 | 25 | 5 | 5 | Agent & Tool Use |
| Benchmark | 20 | 20 | 3 | 3 | Benchmark Playground |
| Neural Network | 0 | **≥ 5** | 0 | **4** | Neural Network |
| Fine-tuning | 0 | **≥ 5** | 0 | **4** | Fine-tuning & Adaptation |
| **Total** | **150** | **160** | **20** | **28** | **8** simulators live |

Assessment-only `asmt-*` (≥ 12) and contest-only `ctst-*` (4) stay **unpublished** — not in the public catalogue, not counted above.

**First exercises (name during Steps 5, 9 and 11):**

| ID | Working title | Step | Skills |
|---|---|---|---|
| **VA1** | Verified Assessment v1 | 5 | RAG + Eval blend, ≥ 12 novel `asmt-*` items |
| **N1** | Read the Learning Curve | 9 | training-dynamics, overfitting |
| **N2** | Size the Model | 10 | model-capacity, hyperparameters |
| **N3** | Regularise or Rethink | 10 | regularisation, overfitting |
| **F1** | Tune or Prompt | 11 | tuning-decision, cost-engineering |
| **F2** | Prep the Dataset | 11 | dataset-prep, contamination |
| **F3** | Judge the Tuned Model | 11 | tuned-model-eval, evaluation-reading |

Working titles only. Skill slugs are already frozen in [phase-3-decisions.md](./phase-3-decisions.md).

---

## Next

When Step 13 is `done`, write the full tutor-marketplace spec (spec §9) before any Phase 4 build. Supply is the hard part: recruit the first tutors from top-ranked platform users before that phase opens.
