# UI/UX Analysis Report — LabPath Platform

**Date:** 2026-09-01  
**Scope:** Full web app (`apps/web`) — layout, navigation, all user flows Phase 0–2  
**Goal:** Identify gaps and define a **10/10 user-friendly** direction  
**Related:** [user-qa-report.md](./user-qa-report.md) · [LabPath Specification](./Labpath%20specification/LabPath-Specification.md)

---

## Executive summary

| Dimension | Current (est.) | Target |
|---|---|---|
| **Visual design** | 7.5 / 10 | Cohesive, confident, “gym not course” |
| **Core workspace UX** | 8 / 10 | Best-in-class submit → feedback loop |
| **Navigation & IA** | 5 / 10 | Obvious paths, zero dead links |
| **Feedback & scorecard** | 7 / 10 | Failure class always actionable |
| **Onboarding & first run** | 7 / 10 | &lt;3 min to first pass, zero confusion |
| **Mobile & responsive** | 5.5 / 10 | Fully usable on tablet/phone |
| **Accessibility** | 5 / 10 | WCAG-minded, keyboard + screen reader ready |
| **Completeness** | 6 / 10 | All Phase 2 surfaces shipped in UI |

**Overall today: ~6.5 / 10** — strong where users spend time (workspace), weak where they orient (nav, missing pages, loading states).

**North star for 10/10:** *Every screen answers “what do I do next?” in one glance. Every fail teaches. Nothing 404s. Nothing hangs silently.*

This aligns with spec principle **P3 — The feedback is the product.**

---

## What users experience today

### Journey map

```
Land (home) → Sign in → Onboarding (R1) → Submit → Scorecard
                ↓
         Catalogue (150) → Exercise workspace → Run / Trace
                ↓
    Paths · Progress · Billing · Leaderboard · Contests (?)
```

### Strengths (keep and amplify)

1. **Exercise workspace is the hero** — 3-pane layout (brief | submit | run), live grading poll during submit, inline verdict + failing samples, hints with Pro gate, quota errors link to billing. This is the product; it mostly delivers.
2. **Visual identity** — Warm orange brand, light/dark theme, polished marketing hero and auth card. Feels intentional, not generic SaaS.
3. **Onboarding = real work** — First solve embeds `WorkspaceShell` with starter config; not a fake tour. Matches “gym” positioning.
4. **Consistent app vocabulary** — `lp-page`, `lp-panel`, stat rows, tables reused across run, trace, progress, billing.
5. **Catalogue filters** — Track + difficulty chips, skeleton loading, empty states with clear copy.
6. **Actionable error copy** — “Sign in”, “Upgrade”, “Check API” — not generic errors.
7. **Trace depth** — Simulator-aware layouts, Pro gating, raw payload for power users.

---

## Critical UX gaps (fix first)

| # | Issue | Impact | Location |
|---|---|---|---|
| 1 | **Contests nav → 404** | Users click Contests in menu; page does not exist in web app | `home-nav.tsx` links to `/contests`; no `app/(app)/contests/` pages |
| 2 | **Hamburger-only navigation** | Desktop users must open overlay for every route; no active state | `home-nav.tsx` — full nav hidden behind menu on all breakpoints |
| 3 | **Blank screen on auth check** | White flash before any protected page | `require-auth.tsx` returns `null` while loading |
| 4 | **Run page never updates** | Bookmarked `/runs/:id` stuck on `queued` forever | `run-detail.tsx` — single fetch, no polling |
| 5 | **“Sign in” always in menu** | Logged-in users still see Sign in link | `home-nav.tsx` static link list |
| 6 | **Magic link page stub** | Route exists but shows placeholder | `magic-link/page.tsx` — not implemented |
| 7 | **Two nav systems, one unused** | Dead code + inconsistent future risk | `app-header.tsx`, `app-nav.tsx` never imported; app uses `HomeNav` only |

---

## Analysis by area

### 1. Navigation & information architecture

**Current pattern:** Marketing-style floating pill header (`ag-header`) everywhere — logo, hamburger, “Get Started”. All 8 links live in a full-screen overlay.

**Problems:**
- No persistent nav on desktop (Catalogue, Progress, Contests buried).
- No **active route** highlighting — users lose context.
- **Contests** and **Paths** same weight as Home in overlay — no grouping (Practice / Account / Community).
- Authenticated users see **“Sign in”** in menu.
- No breadcrumbs on exercise → run → trace chain.

**10/10 direction:**

```
[Logo]  Catalogue  Paths  Contests  Progress     [Avatar ▾]
                              Leaderboard (public)
```

- **Desktop:** horizontal nav, active underline, user menu (Progress, Billing, Sign out).
- **Mobile:** keep hamburger but group links: *Practice* | *Compete* | *Account*.
- **Breadcrumbs:** `Catalogue › RAG › Chunk It Right › Run abc123`.
- Remove dead links or ship missing pages immediately.

---

### 2. Catalogue (150 exercises)

**Current:** Filter chips (6 tracks + difficulty), grid of cards, path strip above.

**Problems:**
- **No search** — finding one exercise in 150 is scroll + filter only.
- **No sort** (difficulty, recent, unsolved).
- No “continue where you left off” or **solved/attempted** badge on cards.
- Path strip **silently hides** on API error (`path-strip.tsx` returns `null`).
- Cards show title + tags but not **time estimate** or **pass rate** (even aggregate).

**10/10 direction:**
- Search bar + sort dropdown sticky below header.
- Card states: `Not started` | `Attempted` | `Passed` (checkmark).
- “Recommended next” row at top (daily drill, path next step, contest problem).
- Empty filter state is good — keep it.

---

### 3. Workspace (exercise UI)

**Current:** Brief | Submission | Run panel — stacks at 1100px.

**Problems:**
- **Grading state** — button says “Grading…” but no progress bar / elapsed time / cancel.
- **Brief markdown** minimal — no lists, code blocks, links (`brief-panel.tsx`).
- **Path/contest context** — only a small back link; no banner (“Contest · 42 min left · hints off”).
- Navigating away during grading silently aborts (no confirm).
- Footer hidden in workspace — fine for focus, but no escape hatch except menu.

**10/10 direction:**
- Grading: animated progress + “Usually 5–30s” + optional cancel.
- Brief: full markdown renderer (code, lists, callouts).
- Context banner for onboarding / path / contest.
- Sticky submit bar on mobile (bottom of viewport).

---

### 4. Feedback & scorecard (the product)

**Current:** Verdict pill, metrics table, failure classes, failing samples, Wilson intervals for benchmarks.

**Problems:**
- **Run detail page** does not poll — worst UX gap after submit-from-elsewhere.
- Grade fetch failure swallowed → looks like “no metrics” (`run-detail.tsx`).
- Failure classes shown as comma list — not **explained** (what is `wrong-tool`? what to try?).
- No **“Try again”** or **“Compare to reference approach”** (hint, not answer).
- Onboarding success: small “Continue to catalogue” link — easy to miss.

**10/10 direction (spec P3):**

```
┌─────────────────────────────────────┐
│  FAIL · wrong-tool                  │
│  You called calculator once; hidden │
│  eval expected json_store too.      │
│                                     │
│  [What this means] [Try again]      │
└─────────────────────────────────────┘
```

- Every failure class links to a **one-paragraph explainer** (static content, not hidden eval).
- Run page polls until terminal state.
- Onboarding pass → **celebration modal** + CTA to catalogue or next path step.

---

### 5. Onboarding & first session

**Current:** Redirect via `FirstSessionGate` → `/onboarding` → R1 with starter values.

**Problems:**
- Two loaders in sequence: `RequireAuth` blank → “Opening your first solve…” → “Preparing…”
- No explicit **completion** when first pass achieved.
- User can skip understanding — starter values pre-filled (good) but no “why these numbers?”

**10/10 direction:**
- Single branded loader for auth + onboarding check.
- 3-step header is good — add **progress dots** (1 Brief · 2 Submit · 3 Score).
- After first pass: modal + streak intro + “Pick your next exercise”.

---

### 6. Progress, profile & engagement

**Current:** Daily drill, quota, skills table, profile settings, attempt history — all on one long page.

**Problems:**
- **5 separate API calls** on load (each component fetches independently).
- Dashboard feels like **stacked panels**, not a command center.
- Attempt history table **overflows on mobile** — no card layout.
- Profile settings buried at bottom of Progress (discoverability).
- Public profile `/u/[slug]` good but slug display confusing.

**10/10 direction:**
- Single `GET /me/progress` aggregated endpoint + one loading skeleton for whole page.
- Top row: **Streak | Today’s drill | Quota bar** (3 stat cards).
- History: card list on mobile, table on desktop.
- Profile: separate nav item or tab under Progress.

---

### 7. Contests & leaderboard (Phase 2)

**Current:** API complete; **web UI missing for contests**. Leaderboard public table works.

**Problems:**
- Nav advertises Contests → **404** — trust-breaking.
- No contest countdown, enter flow, or sampled problem list in UI.
- Leaderboard disconnected from contest CTA (“Enter dogfood-s1”).

**10/10 direction:**
- Ship: `/contests`, `/contests/[slug]`, contest workspace variant (hints off, timer visible).
- Leaderboard tab: **All-time skill** | **Contest season** (when window open).
- Empty leaderboard: “Enter the current contest to appear here.”

---

### 8. Billing & tiers

**Current:** Plan table, Stripe checkout, success/cancel banners.

**Assessment:** Adequate for beta. Upgrade path from 429/quota/contest 403 is wired — good.

**10/10 polish:**
- Inline quota meter in header (Free: 2/3 this week).
- Pro benefits list tied to **what user just hit** (e.g. contest gate).

---

### 9. Visual design system

**Current:** Two parallel systems:
- Marketing: `ag-*` (`home.css`) — hero, nav pill, buttons
- App: `lp-*` (`design.css`) — panels, cards, forms

**Problems:**
- Duplicate button styles (`ag-btn` vs `lp-btn`).
- Unused `lp-header` / `lp-nav` in CSS while app uses `ag-header`.
- Theme toggle **fixed mid-right** — overlaps content (`theme-toggle.css`).
- Focus rings mostly on inputs only — buttons/chips lack `:focus-visible`.

**10/10 direction:**
- **One design system** inside authenticated app: merge into `lp-*`, retire unused `AppHeader` CSS or wire it up.
- Token file: spacing scale (4/8/12/16/24/32), radius, shadows — document in Storybook or `design.css` header.
- Pass/fail semantic colors system-wide (green/red/amber, not just pills).

---

### 10. Mobile & responsive

**Current breakpoints:** 560px, 720px, 900px, 1100px in various CSS files.

**Problems:**
- Workspace stacks but **run panel below fold** on phone — user may miss verdict.
- Data tables (history, trace, leaderboard) horizontal scroll only.
- `workspace.css` large right padding (`3.4rem`) tight on small screens.
- Hamburger on mobile is OK; on tablet/desktop it hurts.

**10/10 direction:**
- Mobile workspace: **Brief collapsed accordion** → Submit → **Sticky run panel** slides up after submit.
- All tables → card pattern below 720px.
- Touch targets ≥ 44px on filter chips and menu items.

---

### 11. Accessibility

**Current basics:** Some `aria-label`, `role="alert"`, Escape closes menu.

**Gaps:**
- Blank auth = no `aria-busy`.
- Filter chips missing `aria-pressed`.
- No skip-to-main link.
- Grading completion not announced (`aria-live`).
- Login errors not tied to input via `aria-describedby`.

**10/10 direction:** Target WCAG 2.1 AA for core flows (login, catalogue, workspace, scorecard). Add axe-core to CI for web.

---

## Roadmap to 10/10

### Phase A — Trust & completeness (1–2 weeks)

| Item | Effort | Impact |
|---|---|---|
| Ship **Contests UI** (list, detail, contest workspace) | L | Critical — nav promise |
| Fix **Run detail polling** | S | High — no stuck runs |
| **Auth loading skeleton** (replace null) | S | High — first impression |
| Remove or fix **magic-link** page | S | Medium |
| Hide **Sign in** when authenticated; add user menu | M | Medium |

### Phase B — Navigation & orientation (1–2 weeks)

| Item | Effort | Impact |
|---|---|---|
| **Desktop persistent nav** with active states | M | High |
| **Breadcrumbs** on exercise / run / trace | S | Medium |
| Group overlay links: Practice / Compete / Account | S | Medium |
| Delete or wire **AppHeader** — one nav system | S | Low (maintainability) |

### Phase C — Catalogue & discovery (1 week)

| Item | Effort | Impact |
|---|---|---|
| **Search** + sort on catalogue | M | High at 150+ exercises |
| **Solved/attempted** badges on cards | M | Medium |
| Path strip **error state** (not silent null) | S | Low |

### Phase D — Feedback excellence (2 weeks)

| Item | Effort | Impact |
|---|---|---|
| **Failure class explainers** (static help text) | M | High — spec P3 |
| Onboarding **completion celebration** + clear next step | S | High |
| Run page: in-progress UI + grade retry | M | Medium |
| Rich **brief markdown** (code, lists) | M | Medium |

### Phase E — Polish & scale (2–3 weeks)

| Item | Effort | Impact |
|---|---|---|
| Progress page **single fetch** + dashboard layout | M | Medium |
| Mobile **card layouts** for tables | M | Medium |
| Design system **consolidation** (ag → lp in app) | L | Medium |
| **Accessibility** pass + axe in CI | M | High long-term |
| Header **quota meter** for Free users | S | Medium |

---

## Design principles for 10/10

Derived from the product spec — use these to judge every UI change:

1. **Feedback is the product** — verdict alone is failure; always show *what failed* and *what class*.
2. **Gym, not course** — no lesson chrome; hints and failure explainers only.
3. **One obvious next action** — every screen has a primary CTA.
4. **Never silent** — loading, grading, errors always visible; never blank or infinite queued.
5. **Practice loops are short** — submit → result in &lt;30s perceived; show progress.
6. **Competition is optional but discoverable** — paths, contests, leaderboard clearly grouped.
7. **Mobile is real** — phone user can complete one full exercise end-to-end.

---

## Quick wins (this week)

1. Add contests pages (API already exists) — **biggest trust fix**.
2. Poll on `/runs/[id]` when status is non-terminal.
3. Replace `RequireAuth` null with skeleton.
4. Conditional nav: hide Sign in, show email/avatar when logged in.
5. Move theme toggle into header (stop overlapping content).

---

## Sign-off

| | |
|---|---|
| **Current UX score** | ~6.5 / 10 |
| **Biggest lever** | Ship missing surfaces + fix navigation |
| **Best existing surface** | Exercise workspace |
| **Target** | 10/10 = workspace quality everywhere + zero dead ends |

**Next doc:** Turn Phase A into tickets; link from [qa-runbook.md](./qa-runbook.md) manual walkthrough after Contests UI ships.
