# ABC / B2C — Frontend Design & Build Plan

Companion to `b2c-backend/docs/BACKEND_PHASES.md`. Backend is complete (233 tests green, 15 phases). This
plans the web frontend against that live API.

**Stack (from scaffold):** Next.js 16 (App Router, RSC) · React 19 · TypeScript · Tailwind CSS v4.
**Suggested additions:** TanStack Query (server state) · Zustand (client/auth state) · Zod (shared validation) ·
React Hook Form · `@xyflow/react` (course tree) · a code editor (CodeMirror 6) · Framer Motion (motion) ·
Radix primitives (a11y) · Recharts (admin metrics).

---

## Progress

- ✅ **FP0 — Foundation & design system** (done: **design tokens** in `app/globals.css` — full palette (bg/ink/line/primary/semantic/6 pastel tints), light + **dark** via `.dark` class, mapped to Tailwind v4 utilities with `@theme inline` + `@custom-variant dark`; **Inter** (next/font, self-hosted — guaranteed) + Geist Mono in root layout with a **no-flash theme script** + `suppressHydrationWarning`; `cn()` util (clsx + tailwind-merge); **10 UI primitives** (`Button` w/ variants+sizes+loading, `Card`/Header/Body/Title/Description, `Badge`, `Input`, `Label`, `Skeleton`, `Spinner`, `Avatar`, `Progress`, `ThemeToggle`) + barrel; **providers** — `ThemeProvider` (via `useSyncExternalStore`, no setState-in-effect), real `QueryProvider` (TanStack Query), composed `AppProviders` wired into layout; **`authStore`** (zustand + persist) + **`apiClient`** (bearer token + **single-flight refresh-on-401** + typed `ApiError`); design-system **showcase** at `/`. Verified: **typecheck 0 · lint 0 errors · `next build` green** (12 routes). Notes: Next 16 breaking changes read from bundled docs — Turbopack default (no flag), async `params`/`searchParams` (for later route-param phases), `middleware`→`proxy` convention (existing `src/middleware.ts` builds as "Proxy"; migrate in FP2). Deps added: `@tanstack/react-query`, `zustand`, `clsx`, `tailwind-merge`, `lucide-react`.
- ✅ **FP1 — Marketing / Landing** (done: approved Sastik-style landing built as real Next.js components using the FP0 design system, at `/` — **statically prerendered**; showcase moved to `/design`. Components in `src/components/marketing/`: `Container` (shared max-width), `Navbar` (client — sticky/scroll-glass, center links + carets, theme toggle, mobile menu), `Hero` (headline + gold-diamond icon + floating coins + feature tabs + dashboard mockup), `Sections` (Why problem/solution w/ SVG gauges, Features grid w/ pastel-tint cards + mini mockups, Lab band + terminal snippet, Stats gradient number, Process 3-steps + quiz mock, Domains 4 gradient cards, CTA), `Pricing` (client — monthly/yearly toggle), `Faq` (client — accordion), `Footer`. All using design tokens (`bg-primary`, `bg-tint-*`, `text-ink`, etc.) so light/dark both work; lucide icons; `buttonClasses()` helper added to Button so `<Link>` shares button styling. Verified: **typecheck 0 · lint 0 errors · `next build` green** (13 routes, `/` static). CTA/nav links point at `/signup` (built in FP2).
- ⬜ FP2–FP13 — pending.

---

## 0. Design language

- **Vibe:** modern, technical-but-approachable SaaS. Slightly "cyber" (this is a security/skills platform)
  without being a hacker cliché. Confident whitespace, crisp type, purposeful motion.
- **Theme:** dark-first with a proper light mode (both fully supported).
- **Color:**
  - Base neutrals (slate/zinc) for surfaces & text.
  - **Primary accent:** electric indigo/violet (brand, CTAs, active states).
  - **Secondary accent:** cyber-teal/green (labs, "live", success, streak fire).
  - Semantic: success (emerald), warning (amber), danger (rose), info (sky).
- **Type:** a clean geometric/grotesk sans for UI (e.g. Inter/Geist) + a **monospace** (Geist Mono) for
  labs, terminal, code, and small technical labels.
- **Radius/elevation:** medium rounded (rounded-xl), soft shadows, subtle borders; glassy nav on scroll.
- **Motion:** small, fast, meaningful (hover lifts, tree reveal, streak flame, generation shimmer). Respect
  `prefers-reduced-motion`.
- **Imagery:** product mockups (course tree, terminal, SOC alerts) over stock photos.

---

## 1. Landing page (`/`) — section-by-section

Marketing home for logged-out visitors. Goal: explain the promise fast, show the labs, convert to signup.

1. **Sticky nav** — logo · links (Features, Domains, Pricing, How it works) · Theme toggle · `Log in` ·
   `Start free` (primary). Transparent over hero → glassy/solid on scroll.
2. **Hero** — big headline (e.g. *"Tell it what to learn. Get a full course + hands-on labs — built by AI."*),
   supporting line, dual CTA (`Start free` / `See how it works`), and an animated product visual: a
   **course tree assembling itself** (Course → Modules → Lessons) morphing into a terminal/SOC card. Trust row
   ("No credit card · Free tier · Cancel anytime").
3. **How it works (3 steps)** — ① Pick a topic & level → ② AI generates Course → Module → Lesson → ③ Practice
   in real labs, quizzes & exams. Simple numbered cards with micro-illustrations.
4. **Feature grid (6)** — AI course generation · Domain-specific labs · Quizzes & exams (auto-graded) ·
   Gamified streaks & achievements · Progress tracking · Smart AI cost limits (fair usage). Icon + title + line.
5. **Domains showcase** — tabbed/segmented preview: **Cybersecurity** (SOC simulator), **Networking**
   (SIEM/packet analysis), **Programming** (sandboxed code execution), **Systems** (emulated terminal).
   Each tab shows a live-looking mock of that lab.
6. **Interactive lab teaser** — a faux **terminal** or **SOC alert triage** card the visitor can "poke"
   (typewriter/demo), reinforcing "you actually *do*, not just read."
7. **Gamification band** — streak flame counter, achievement badges, progress ring — "stay consistent, level up."
8. **Pricing preview** — Free vs Premium cards (mirrors backend tiers/quotas), `See full pricing` link.
9. **Testimonials / outcomes** — placeholder cards (swap for real later).
10. **Final CTA band** — full-width, high-contrast: *"Start your first AI-built course free."* → `Start free`.
11. **Footer** — product links, Domains, Pricing, **Privacy** (GDPR export/delete), Terms, socials, © line.

> Accessibility & perf are first-class: semantic sections, keyboard nav, `next/image`, mostly RSC/static,
> islands of interactivity only where needed.

---

## 2. Full page inventory (mapped to the live API)

Legend — 🔓 public · 🔒 auth required · 👑 admin.

### Marketing (public)
| Route | Page | Purpose | API |
|---|---|---|---|
| `/` 🔓 | Landing | Convert visitors | — |
| `/pricing` 🔓 | Pricing | Free vs Premium detail | — |
| `/about` 🔓 (opt) | About | Trust/story | — |
| `/legal/privacy`, `/legal/terms` 🔓 | Legal | Compliance | — |

### Auth (`app/(auth)`)
| Route | Page | Purpose | API |
|---|---|---|---|
| `/login` 🔓 | Log in | Email/password + Google | `POST /auth/login`, `POST /auth/google` |
| `/signup` 🔓 | Sign up | Create account | `POST /auth/signup`, `POST /auth/google` |
| — | Token refresh (silent) | Keep session | `POST /auth/refresh`, `POST /auth/logout` |

### Onboarding (`app/(onboarding)`)
| Route | Page | Purpose | API |
|---|---|---|---|
| `/create-course` 🔒 | Course intake | Category, topics, level, prefs (visuals, daily reminder) → generate | `POST /courses` (202 generating) |

### App (`app/(app)`)
| Route | Page | Purpose | API |
|---|---|---|---|
| `/dashboard` 🔒 | Dashboard | Active courses, streak, progress, achievements, quick actions | `GET /courses`, `/progress`, `/gamification/me`, `/subscriptions/me` |
| `/courses` 🔒 | My courses | List + status (generating/ready/failed) | `GET /courses` |
| `/courses/[courseId]` 🔒 | Course overview | Modules, progress %, generating/failed states, launch exam | `GET /courses/:id`, `POST /courses/:id/exam` |
| `/courses/[courseId]/structure` 🔒 | Course map | **React Flow tree** (Course→Module→Lesson), navigate | `GET /courses/:id/structure` |
| `/lesson/[lessonId]` 🔒 | Lesson | Read content, start/complete, streak feedback, "generate quiz/exercise" | `GET /lessons/:id`, `POST /:id/start`, `/:id/complete`, `/:id/quizzes`, `/:id/exercises` |
| `/lesson/[lessonId]/quiz/[quizId]` 🔒 | Quiz | Take quiz, submit, results (answers revealed correctly) | `GET /quizzes/:id`, `POST /:id/submit` |
| `/lesson/[lessonId]/exercise/[exerciseId]` 🔒 | Exercise + Lab | Task spec + the domain lab, submit → async grade poll | `GET /exercises/:id`, `POST /:id/submit`, `GET /exercises/submissions/:sid` |
| `/exam/[examId]` 🔒 | Exam | Module/course exam, submit, score | `GET /exams/:id`, `POST /:id/submit` |
| `/labs/*` 🔒 (within exercise) | Lab surfaces | Code editor / terminal / SOC / network scenario | `POST /labs/code/execute`, `/labs/terminal/command`, `GET|POST /labs/soc/*`, `/labs/network/*` |
| `/achievements` 🔒 | Achievements | Earned + locked catalog, streak | `GET /gamification/achievements`, `/me` |
| `/upgrade` 🔒 | Upgrade/Billing | Plan compare, checkout, manage | `GET /subscriptions/me`, `POST /subscriptions/checkout`, `/portal` |
| `/settings` 🔒 | Settings | Profile, prefs (timezone, notifications, visuals), **data export**, **delete account** | `GET|PATCH /users/me`, `GET /users/me/export`, `DELETE /users/me` |
| `/notifications` 🔒 (or dropdown) | Notifications | History | `GET /notifications` |

### Admin (`app/(admin)` — internal)
| Route | Page | Purpose | API |
|---|---|---|---|
| `/admin/metrics` 👑 | Metrics | Signups, gen success rate, completion, AI cost | `GET /admin/metrics` |
| `/admin/costs` 👑 | AI cost | Aggregate + per-user spend | `GET /admin/costs` |
| `/admin/content` 👑 | Moderation | Flag / regenerate bad AI content | `GET /admin/content/:type`, `POST .../flag`, `.../regenerate`, `GET /admin/flags`, `POST /admin/flags/:id/resolve` |

---

## 3. Cross-cutting states (design every one)
Loading (skeletons), empty (first-run illustrations + CTA), error (retry), **generating** (course/exercise —
shimmer + poll), **async grading** (pending → graded), quota/limit reached (upgrade prompt), offline, 404/403.

---

## 4. Phased build plan

Each phase ships a vertical slice; cross-cutting concerns (a11y, responsive, loading/empty/error, tests)
built in, not deferred.

- **FP0 — Foundation & design system:** Tailwind theme + tokens (color/type/spacing/radius), dark/light,
  UI primitives (`Button, Input, Select, Card, Badge, Modal/Dialog, Toast, Tabs, Skeleton, Avatar, Progress,
  Tooltip, DropdownMenu`), app shell (top bar + sidebar), typography, icons, **API client** (fetch wrapper +
  auth header + refresh-on-401), TanStack Query + Zustand providers, env config, error boundary.
- **FP1 — Marketing:** landing (all sections above), pricing, legal, public nav/footer, theme toggle, SEO/OG,
  responsive + motion. *(Mostly static/RSC — fast.)*
- **FP2 — Auth:** login, signup, Google OAuth, form validation, session store, silent refresh, route guards
  (redirect logged-out → `/login`, logged-in → `/dashboard`), logout.
- **FP3 — Onboarding:** `/create-course` intake (multi-step: domain/topics → level → preferences), submit →
  **generating** screen with poll + progress, handle failure/retry.
- **FP4 — Dashboard:** overview widgets (continue learning, streak, progress rings, achievements teaser,
  plan/quota status), quick actions, empty first-run state.
- **FP5 — Courses & structure:** course list (status chips), course overview, **React Flow course tree**
  (interactive, deep-link to lessons), generating/failed handling.
- **FP6 — Lessons & progress:** lesson reader (rich content, optional visuals), start/complete, **streak
  feedback** animation, course progress recompute, next-lesson nav.
- **FP7 — Assessments:** quiz runner (question types, submit, results with correct answers), exam runner
  (module/course), score screens, retake.
- **FP8 — Exercises & labs (highest UI effort):** exercise view + the domain labs — **code editor**
  (CodeMirror + run → stdout/err/timeout), **emulated terminal** (xterm-style), **SOC** alert-triage &
  **Network/SIEM** scenario UIs (question forms + scoring), submit → **async grade poll**.
- **FP9 — Gamification:** achievements page (earned/locked, unlock animation), streak & badges, toasts on
  award (hook into lesson/quiz completion responses).
- **FP10 — Subscription/billing:** `/upgrade` plan compare, Stripe **checkout redirect**, **customer portal**
  redirect, tier/quota reflected across app, "limit reached → upgrade" prompts.
- **FP11 — Settings & notifications:** profile + preferences (timezone, daily reminder, visuals), **GDPR
  export** download, **delete account** (confirm flow), notification center.
- **FP12 — Admin console:** metrics/cost dashboards (Recharts), content moderation (flag/regenerate/resolve),
  admin-only guard.
- **FP13 — Polish & hardening:** full a11y pass (keyboard, focus, ARIA, contrast), responsive audit (mobile→
  desktop), all loading/empty/error/quota states, perf (RSC/streaming, image/bundle), analytics hooks,
  E2E (Playwright) on the core flows (signup → create course → learn → quiz → upgrade), deploy config.

**Dependency order:** FP0 → FP1/FP2 (parallelizable) → FP3 → FP4 → FP5 → FP6 → FP7 → FP8 → FP9/FP10/FP11
(parallelizable) → FP12 → FP13.

---

## 5. Shared conventions
- **`src/features/*`** already exists per domain (auth, courses, assessments, exercises, labs, gamification,
  onboarding, subscription) — keep feature-scoped components/hooks/api there; shared UI in `src/components/ui`.
- **`src/infrastructure`** — API client, query keys, auth token store. **`src/domain`** — types mirrored from
  backend (or generated). **`src/lib`** — utils. **`src/store`** — Zustand slices.
- Server state via Query (cache, poll for generating/grading); client state (auth, theme, UI) via Zustand.
- Types shared/derived from backend response shapes to stay in sync.
