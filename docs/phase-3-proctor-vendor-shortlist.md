# O15 — Proctor vendor shortlist

Worksheet for **Phase 3 Step 3**. Owner: **Yonatan Benezra** (security/abuse + privacy/DPIA).

Decisions this must respect: [phase-3-decisions.md](./phase-3-decisions.md) — **O10** (record-and-review, no biometric match), **O11** (≤ €8 per sitting).

> **Fill every cell from the contract, the DPA, or a written quote — never from a marketing page.** Residency, retention, and price are the three fields vendors describe loosely in public and precisely in contracts. A cell you cannot evidence stays `?`, and `?` never counts as a pass.

---

## Part 1 — Hard gates (pass/fail)

A vendor that fails any row here is out. No weighing, no "they said they could add it".

| # | Gate | Why it is a gate | V1 | V2 | V3 |
|---|---|---|---|---|---|
| 1 | **Record-and-review** available without live invigilation | O10. Live proctoring costs several times more and forces scheduling | | | |
| 2 | **≤ €8 per sitting** at our volume (~4 sittings/Pro/yr), in a written quote | O11 margin: 4 × €8 = €32/yr against €288/yr Pro revenue | | | |
| 3 | No **minimum commitment** or seat licence that breaks a low-volume start | We ship one assessment; we cannot pre-buy thousands | | | |
| 4 | **EU processing and EU storage**, named in the DPA | GDPR posture; EUR-priced EU learners | | | |
| 5 | **Retention configurable to 30 days**, deletion verifiable | O10 retention job; Step 13 requires a demonstrated deletion | | | |
| 6 | Works with **biometric face-match OFF** | O10 keeps us out of GDPR Art. 9 special-category data | | | |
| 7 | **Web SDK** — no native app, no desktop installer | Learners sit in a browser; an installer kills conversion | | | |
| 8 | **Signed DPA + sub-processor list** available before integration | Step 3 cannot capture a single recording without it | | | |
| 9 | **Recording export + deletion on termination** | Never be unable to leave | | | |
| 10 | Documented behaviour **without a webcam** and with **screen readers** | O10 fallback path; write it before a learner meets it | | | |

**Gate result:** V1 `?` · V2 `?` · V3 `?`

---

## Part 2 — Comparison (only for vendors that passed Part 1)

| Field | V1 | V2 | V3 |
|---|---|---|---|
| Vendor / product | | | |
| Price per sitting (quoted, EUR) | | | |
| Price model (per sitting / per minute / tiered) | | | |
| Setup or platform fee | | | |
| Review workflow — do *we* review, or do they? | | | |
| If they review: reviewer location, and is that in the DPA? | | | |
| Flag types produced (focus loss, second face, paste, …) | | | |
| Data captured beyond webcam + screen | | | |
| Retention default / minimum / configurable floor | | | |
| Deletion: API, or support ticket? | | | |
| Sub-processors (count and where) | | | |
| Certifications claimed (ISO 27001, SOC 2) — and dated report? | | | |
| Browser support matrix | | | |
| Accessibility statement / WCAG claim | | | |
| SDK integration effort (our estimate, days) | | | |
| Sandbox or trial account available? | | | |
| Contract term and exit notice | | | |

---

## Part 3 — Questions to send them

Copy this into the first email. Written answers become DPIA evidence.

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

---

## Part 4 — Sourcing candidates

Unverified starting points only — this list carries **no claims** about price, residency, retention, or capability. Every one of them is subject to Part 1 exactly like an unknown vendor:

- Established exam-proctoring vendors (search "record and review proctoring API / SDK")
- EU-headquartered proctoring providers specifically, since gate 4 is where most candidates fail
- Assessment platforms that expose proctoring as a standalone SDK rather than a whole exam suite

Aim for **three** that clear Part 1. Two is enough if the third cannot be found — one is not, because a single option is not a negotiation.

---

## Part 5 — Decision

| Field | Value |
|---|---|
| Chosen vendor | |
| Quoted price per sitting | |
| Inside the €8 ceiling? | |
| DPA signed on | |
| DPIA completed on | |
| Contract signed by | **must not be Yonatan Benezra** — see the separation-of-duties note in [phase-3-decisions.md](./phase-3-decisions.md) |
| Decided on | |

### If nothing clears Part 1

Stop. Do not integrate the least-bad option and hope.

- **Price is the blocker** → **O10 reopens.** Re-price the choice: telemetry-only (no camera) against a lower-cost claim, or move the cost onto a paid-only sitting (which is an **O11** change)
- **Residency is the blocker** → **O10 reopens.** No non-EU video storage without a fresh transfer analysis
- **Only live invigilation is offered** → **O10 reopens.** Live proctoring was explicitly ruled out of v1

Record the reopen in [phase-3-decisions.md](./phase-3-decisions.md) before any code is written against a vendor.
