# Phase 0 — Alignment Decisions

**Status:** Locked for MVP implementation (2026-08-20)  
**Source:** [MVP-AI-Engineering-Platform-Requirements.md](./MVP-AI-Engineering-Platform-Requirements.md) §8, §11

These defaults unblock Phase 1. Client can override before public launch.

---

## Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| **Requirements doc** | Accepted as v1.1 baseline | LeetCode-style AI practice pivot; guest-first flow |
| **Problem types (MVP)** | **MCQ only** | Fastest path to shippable feedback loop; code/short-answer in Phase 2 |
| **Free problem limit** | **3** (`FREE_PROBLEM_LIMIT`) | Confirmed in requirements §5.5.1 |
| **Gate timing** | Login **before opening Q4** | User finishes Q1–Q3 fully offline in localStorage; gate on “Next” after 3rd feedback |
| **Signup at gate** | **Login + signup** both allowed | Lower friction than login-only |
| **Brand (MVP shell)** | Keep **LabPath** name/mark | No rebrand work in Phase 1; copy positions as “AI engineering practice” |
| **Skill display** | **Beginner / Intermediate / Advanced** labels | Derived from avg score per topic (not raw % on main UI) |
| **Sync conflicts** | **Idempotent merge** | Upsert by `(userId, problemSlug)`; local guest data fills gaps; DB wins on duplicate slug if already synced |
| **Initial content** | **18 seeded MCQ problems** | 6 topics × 3 problems; no runtime AI generation for bank |
| **UI locale** | **English only** | Hide i18n selector in MVP shell |
| **Non-MVP surfaces** | **Hide nav links** | Courses, instructor, admin, pricing, marketplace — routes remain, no chrome links |

---

## Out of scope (Phase 1)

- `/problems` browse page (Phase 2)
- Code editor + AI code grading (Phase 2)
- Admin problem editor (Phase 3)
- Paid tiers / subscriptions UI

---

## Sign-off

| Stakeholder | Status | Date |
|-------------|--------|------|
| Engineering | ✅ Locked defaults above | 2026-08-20 |
| Client (Yonatan) | ⏳ Pending explicit sign-off | — |

---

*Phase 1 implementation proceeds on engineering defaults until client feedback.*
