# Phase 1 — Decision record

Locked during **Step 1 — Kickoff & pricing decisions** (2026-08-29). Change only via explicit team review before Stripe launch (Step 7).

Source: [LabPath-Specification.md](./Labpath%20specification/LabPath-Specification.md) §8, §10, §12.2, O2/O3/O8 in [phase.md](./phase.md).

---

## O2 — Brand

| Field | Decision |
|---|---|
| Consumer brand | **LabPath** |
| Endorsement | **by Bina** (footer + auth screens; not co-branded logo) |
| Product line | Practice platform for AI engineering |

---

## O3 — Free tier

| Field | Decision |
|---|---|
| Quota | **3 graded exercises per calendar week** (UTC, Monday 00:00 reset) |
| Rationale | Start generous for activation; tighten only if abuse appears |
| Trace access | Summary scorecard only; no full retrieval trace on Free |
| Hints | First hint free per exercise; further hints require Pro (enforce in Step 8) |

---

## O8 — Unit economics (closed for beta pricing)

Spec blend ≈ **€0.16/attempt** at 150 attempts/mo exceeded Pro margin at €19/mo. Beta package:

| Field | Decision |
|---|---|
| **Pro price** | **€24/mo** · **€199/yr** |
| **Pro fair-use** | **60 graded attempts / month** (rolling 30-day window at enforcement) |
| **Target blended cost** | **≤ €0.10 / attempt** via cheaper judge tier + gen/judge cache reuse |
| **Max compute / Pro user / month** | **≤ €6.00** (25% of €24) |
| **Sanity check** | 60 × €0.10 = €6.00 at fair-use cap |

**Levers if blend drifts above €0.10:** lower fair-use to 50, raise Pro to €29, or tighten judge model tier further. Do not launch Step 7 until dashboard shows blend ≤ €0.10 on dogfood traffic.

---

## Sandbox (Phase 1 Steps 4–5)

| Field | Decision |
|---|---|
| Runtime | **gVisor** for public-beta Python sandbox |
| Limits | 512 MB RAM · 30 s wall clock · no persistent FS · network only via model gateway allowlist |
| Firecracker | Re-evaluated in Phase 2 Step 1: **keep gVisor**; Firecracker out of Phase 2 — [phase-2-decisions.md](./phase-2-decisions.md) |
| Security review | Engineering lead signs checklist before Step 5 wires sandbox to grading |

---

## Step 1 sequencing

| Track | Next step | Notes |
|---|---|---|
| Content / harness | **Step 2** — Prompt Engineering harness + P1 | Does not require sandbox |
| Infrastructure | Step 4 — Sandbox foundation | Can run parallel after Step 2 starts; do not block PE on sandbox |

---

## Implementation constants (for Steps 6–8)

These values are the source of truth for billing code:

```
FREE_EXERCISES_PER_WEEK=3
PRO_PRICE_EUR_MONTHLY=24
PRO_PRICE_EUR_ANNUAL=199
PRO_FAIR_USE_ATTEMPTS_MONTHLY=60
PRO_MAX_COMPUTE_EUR_MONTHLY=6.00
TARGET_BLEND_EUR_PER_ATTEMPT=0.10
```
