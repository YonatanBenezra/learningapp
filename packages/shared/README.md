# @aieng/shared

Cross-app TypeScript constants and types. **No runtime dependencies.**

## Exports

- `AI_CATEGORY_NAMES` — canonical AI engineering topic list
- `FREE_PROBLEM_LIMIT` — guest free tier (3 questions before login)
- `GUEST_PRACTICE_STORAGE_KEY` — localStorage key for guest session bundle

## Build

```bash
npm run build -w @aieng/shared
```

Required before `@aieng/api` TypeScript compile. `@aieng/web` consumes via `transpilePackages`.
