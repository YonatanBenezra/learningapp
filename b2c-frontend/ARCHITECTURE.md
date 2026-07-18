# b2c-frontend — architecture (scaffold)

Next.js 16 (App Router at root `app/`) + React 19 + Tailwind v4. Layered, feature-based `src/`.

Path alias: `@/*` -> repo root (see `tsconfig.json`), so imports are `@/src/...` and `@/app/...`.

## Layout
- `app/` — routes only (route groups: `(auth)`, `(onboarding)`, `(app)`)
- `src/domain/` — entity types (User, Course, Module, Lesson, Exercise, Quiz, Exam)
- `src/features/` — feature modules (auth, courses, onboarding, exercises, assessments,
  labs, subscription, gamification) — each owns its api + components + hooks
- `src/infrastructure/` — apiClient (fetch), queryClient
- `src/providers/` — React context providers
- `src/hooks/` — shared hooks (e.g. `useAsyncJobStatus`)
- `src/store/` — global client state
- `src/components/ui`, `src/components/layout` — shared primitives

## Dependencies to install before implementing
The scaffold does NOT import these yet:

    npm install @tanstack/react-query @xyflow/react @monaco-editor/react @xterm/xterm zustand zod

- `@xyflow/react` — course structure graph (§1.4)
- `@monaco-editor/react` — Code Editor lab (§2)
- `@xterm/xterm` — Terminal lab (§2)
- `@tanstack/react-query` — async/server state
- `zustand` — client state

> Heavy libs (Monaco, xterm, xyflow): use `next/dynamic` code-splitting so they don't
> bloat every bundle (§5).

> Scaffold only — pages/components are stubs (`TODO: implement`).
