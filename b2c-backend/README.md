# b2c-backend

ABC/B2C API — Node/Express/Mongoose/MongoDB (TypeScript). Standalone, independent from Bina infra.

## Stack
- Express + Mongoose (MongoDB)
- BullMQ + Redis (async course generation & grading — §8)
- Zod validation, JWT auth, tier-aware rate limiting + usage quotas (§9)

## Getting started
    npm install
    cp .env.example .env   # fill in secrets
    npm run dev

## Structure
- `src/modules/*` — feature modules (auth, users, courses, modules-content, lessons,
  progress, exercises, assessments, gamification, subscriptions, ai-guidance, notifications, admin)
- `src/modules/labs/*` — ISOLATED sandboxed lab environments (§2). Treat code/terminal
  execution as untrusted at all times (§7.1).
- `src/middlewares`, `src/jobs`, `src/config`, `src/common`

> Scaffold only — controllers/services are stubs (`TODO: implement`). Mongoose models
> carry their schema shapes from the spec (§3.3).
