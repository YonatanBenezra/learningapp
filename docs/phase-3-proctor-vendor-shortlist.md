# O15 — Proctor vendor shortlist

Worksheet for **Phase 3 Step 3**. Owner: **Yonatan Benezra** (security/abuse + privacy/DPIA).

Decisions this must respect: [phase-3-decisions.md](./phase-3-decisions.md) — **O10** (record-and-review, no biometric match), **O11** (≤ €8 per sitting).

> **Fill every cell from the contract, the DPA, or a written quote — never from a marketing page.** Residency, retention, and price are the three fields vendors describe loosely in public and precisely in contracts. A cell you cannot evidence stays `pending`, and `pending` never counts as a pass.

**Status (2026-09-13):** Pre-screen complete. Demo playbook ready: [phase-3-proctor-demo-playbook.md](./phase-3-proctor-demo-playbook.md). **Constructor SDK playground** can be tried now (no vendor call). Sales demos: book via playbook. Notes template: [phase-3-proctor-demo-notes.md](./phase-3-proctor-demo-notes.md).

---

## Part 1 — Hard gates (pass/fail)

A vendor that fails any row here is out. No weighing, no "they said they could add it".

| # | Gate | Why it is a gate | V1 PRUEFSTER | V2 Talview EU | V3 Constructor Proctor |
|---|---|---|---|---|---|
| 1 | **Record-and-review** available without live invigilation | O10. Live proctoring costs several times more and forces scheduling | pending | pending | pending |
| 2 | **≤ €8 per sitting** at our volume (~4 sittings/Pro/yr), in a written quote | O11 margin: 4 × €8 = €32/yr against €288/yr Pro revenue | pending | pending | pending |
| 3 | No **minimum commitment** or seat licence that breaks a low-volume start | We ship one assessment; we cannot pre-buy thousands | pending | pending | pending |
| 4 | **EU processing and EU storage**, named in the DPA | GDPR posture; EUR-priced EU learners | pending | pending | pending |
| 5 | **Retention configurable to 30 days**, deletion verifiable | O10 retention job; Step 13 requires a demonstrated deletion | pending | pending | pending |
| 6 | Works with **biometric face-match OFF** | O10 keeps us out of GDPR Art. 9 special-category data | pending | pending | pending |
| 7 | **Web SDK** — no native app, no desktop installer | Learners sit in a browser; an installer kills conversion | pending | pending | pending |
| 8 | **Signed DPA + sub-processor list** available before integration | Step 3 cannot capture a single recording without it | pending | pending | pending |
| 9 | **Recording export + deletion on termination** | Never be unable to leave | pending | pending | pending |
| 10 | Documented behaviour **without a webcam** and with **screen readers** | O10 fallback path; write it before a learner meets it | pending | pending | pending |

**Gate result:** V1 `pending` · V2 `pending` · V3 `pending`

### Pre-screen notes (public sources only — not gate passes)

| Vendor | Why shortlisted | What to verify first |
|---|---|---|
| **V1 PRUEFSTER** | German processor; REST API; AI flags + human post-exam review; GDPR page claims EU-only processing (Berlin/Frankfurt, IONOS) | Written quote at 50/500 sittings; DPA residency clause; confirm AI-only mode needs no live proctor |
| **V2 Talview EU** | EU-hosted proctoring product (Netherlands); Proctoring API; Record-and-Review mode advertised | Enterprise quote — marketing targets universities; confirm low-volume start and per-sitting price |
| **V3 Constructor Proctor** | Post-review mode; open API + SDK; EU regional hosting; no-webcam + no-video modes shipped Mar 2026 | Quote at our volume; confirm post-review (not live) meets O10; DPA names EU region |

### Rejected in pre-screen (do not pursue unless shortlist fails)

| Vendor | Blocker |
|---|---|
| **VigiExam** | Gate 1 — product is live human monitoring (1:8 proctor ratio), not record-and-review only |
| **AutoProctor** | Gate 4 — all data stored in US; SCCs, not EU residency. Cheap SDK (~€1.30/sitting with recording) but fails O15 residency |
| **ProctorU Record+** | Gate 4 — US-based; ~$6.50/sitting fits O11 but EU storage not evidenced. Revisit only if EU DPA exists |

---

## Part 2 — Comparison (only for vendors that passed Part 1)

Fill after Part 1 gates are confirmed from quotes/DPAs.

| Field | V1 PRUEFSTER | V2 Talview EU | V3 Constructor Proctor |
|---|---|---|---|
| Vendor / product | PRUEFSTER — AI Proctoring + REST API | Talview — EU Remote Proctoring / Proctoring API | Constructor Proctor |
| Price per sitting (quoted, EUR) | pending | pending | pending |
| Price model (per sitting / per minute / tiered) | pending | pending | pending |
| Setup or platform fee | pending | pending | pending |
| Review workflow — do *we* review, or do they? | Marketing: PRUEFSTER staff review flagged clips; provider gets incident report | Marketing: institution-designated reviewers in post-exam mode | Marketing: institution reviewers confirm/dismiss AI flags in post-review mode |
| If they review: reviewer location, and is that in the DPA? | pending — staff described as EU-based | pending — EU proctors in Germany advertised | pending |
| Flag types produced (focus loss, second face, paste, …) | pending | pending | pending |
| Data captured beyond webcam + screen | pending | pending | pending |
| Retention default / minimum / configurable floor | pending | pending | pending |
| Deletion: API, or support ticket? | pending | pending | pending |
| Sub-processors (count and where) | pending | pending | pending |
| Certifications claimed (ISO 27001, SOC 2) — and dated report? | pending | pending | pending — ISO 27001 claimed |
| Browser support matrix | pending | pending | pending |
| Accessibility statement / WCAG claim | pending | pending | pending |
| SDK integration effort (our estimate, days) | pending — REST API, docs at onboarding | pending — Proctoring API, white-label | pending — open API + Secure Browser SDK |
| Sandbox or trial account available? | pending — demo to get API docs | pending — tenant from Sales | **Yes — public SDK playground:** https://sdk-demo.web.proctor.constructor.app/ |
| Contract term and exit notice | pending | pending | pending |

---

## Part 3 — Questions to send them

Copy into the first email. Written answers become DPIA evidence.

1. Quote us **record-and-review only**, per sitting, at ~50 and ~500 sittings/year. No live invigilation.
2. Is there a minimum annual commitment or seat licence? What is the smallest viable contract?
3. Where is video **processed**, and where is it **stored**? Name the regions in the DPA, not in an email.
4. Can retention be set to **30 days**, with a **90-day hold** while a dispute is open? Is deletion API-driven and auditable?
5. Can we run with **face-matching and ID-document capture disabled**? Confirm no biometric template is created.
6. Full **sub-processor list** with locations and roles.
7. If your staff review recordings, **where are those reviewers**, and is that transfer covered?
8. Send your **DPA**, your **DPIA support pack**, and your current **ISO 27001 / SOC 2** report — dated.
9. What does the learner see if the **webcam is denied or absent**? What is documented for **screen-reader** users?
10. On termination: how do we **export** and how do we **delete**? How long does each take?

### Outreach email (ready to send)

**Subject:** LabPath — record-and-review proctoring quote (EU, API, ~50–500 sittings/yr)

```
Hi,

We are LabPath (labpath.com) — a graded practice platform for AI engineers, operated by Bina/CyberProAI. We are scoping a third-party proctoring integration for verified assessments (Phase 3).

We need record-and-review only — no live invigilation, no biometric face-matching, no ID-document capture. Learners sit in a browser via our API; we capture webcam + screen for asynchronous review after the sitting closes.

Hard requirements:
- Record-and-review (async) — not live proctoring
- Web SDK or REST API we embed in our product (no native app / desktop installer)
- EU processing and EU storage, named in your DPA
- Retention configurable to 30 days (90 days during dispute)
- Per-sitting price ≤ €8 at ~50 sittings/year, with a quote at ~500 sittings/year
- Face-matching and ID capture disabled; no biometric templates stored
- Documented fallback when webcam is unavailable or for screen-reader users
- Export + deletion on contract termination

Please reply with:
1. Written per-sitting quote at 50 and 500 sittings/year (record-and-review only)
2. Minimum commitment / smallest contract
3. Your DPA and sub-processor list
4. Confirmation of EU data residency in the contract (not marketing copy)
5. Answers to the ten questions in our vendor worksheet (attached or inline)

We are comparing three EU-capable vendors this week. Timeline: vendor selected by end of month; integration starts only after DPA + DPIA are signed.

Best,
Yonatan Benezra
LabPath / Bina
```

**Demo paths (Jewel Mia books):**

| Vendor | Self-service now | Book sales demo |
|---|---|---|
| **Constructor** | https://sdk-demo.web.proctor.constructor.app/ | all-sales@constructor.tech |
| **PRUEFSTER** | — | https://pruefster.com → "I want to provide an exam" · +49 5161 7089050 |
| **Talview EU** | SDK docs public: docs.talview.com/sdk/proctoring (needs tenant) | https://www.talview.com/en/demo · us@talview.com |

Full playbook: [phase-3-proctor-demo-playbook.md](./phase-3-proctor-demo-playbook.md)

---

## Part 4 — Sourcing candidates

**Shortlisted (2026-09-13):** PRUEFSTER · Talview EU · Constructor Proctor

Aim for **three** that clear Part 1. Two is enough if the third cannot be found — one is not, because a single option is not a negotiation.

---

## Part 5 — Decision

| Field | Value |
|---|---|
| Chosen vendor | *pending outreach* |
| Quoted price per sitting | |
| Inside the €8 ceiling? | |
| DPA signed on | |
| DPIA completed on | |
| Contract signed by | **Jewel Mia** (≠ privacy/DPIA owner Yonatan Benezra) |
| Decided on | |

### If nothing clears Part 1

Stop. Do not integrate the least-bad option and hope.

- **Price is the blocker** → **O10 reopens.** Re-price the choice: telemetry-only (no camera) against a lower-cost claim, or move the cost onto a paid-only sitting (which is an **O11** change)
- **Residency is the blocker** → **O10 reopens.** No non-EU video storage without a fresh transfer analysis
- **Only live invigilation is offered** → **O10 reopens.** Live proctoring was explicitly ruled out of v1

Record the reopen in [phase-3-decisions.md](./phase-3-decisions.md) before any code is written against a vendor.

---

## Next actions

- [ ] **Now:** Try Constructor SDK playground (browser, 10 min)
- [ ] Jewel books PRUEFSTER + Talview + Constructor sales demos (playbook email)
- [ ] Fill demo notes → [phase-3-proctor-demo-notes.md](./phase-3-proctor-demo-notes.md)
- [ ] Log written quotes in Part 2
- [ ] Mark Part 1 gates pass/fail from DPA + quote (not marketing)
- [x] Name contract signer — **Jewel Mia** (≠ Yonatan Benezra, privacy/DPIA owner)
- [ ] If one vendor clears all gates → fill Part 5 → Jewel signs DPA → Yonatan DPIA
