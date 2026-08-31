# Phase 2 — Decision record

Locked during **Step 1 — Kickoff & decisions** (2026-09-01). Change only via explicit team review before Agent runtime (Step 2) or contest launch (Step 10).

Source: [LabPath-Specification.md](./Labpath%20specification/LabPath-Specification.md) §6, §8, §10, §12.2, §12.4; O9 in [phase.md](./phase.md); Phase 1 sandbox in [phase-1-decisions.md](./phase-1-decisions.md).

O2, O3, O8 stay as Phase 1 locked. Do not reopen them here.

---

## O9 — Agent isolation

Phase 1 used **gVisor** (`runsc`) for BYOC Python and deferred Firecracker to this phase. Re-evaluate result:

| Field | Decision |
|---|---|
| Runtime | **Keep gVisor** for Agent jobs |
| Why | Existing image, isolated `labpath_sandbox` network, gateway allowlist, and `sandbox_timeout` / `sandbox_oom` already grade `rag-009`. Firecracker is a new image/jailer workstream and would delay A1 |
| Existing BYOC | Unchanged: **512 MB / 30 s** (RAG Python retriever and any Phase 1 sandbox exercise) |
| Firecracker | **Out of Phase 2.** Re-open only if Step 2 security review finds gVisor insufficient for multi-step tool amplification (escape or egress). Do not start a Firecracker spike in parallel with Step 2 |

---

## Agent envelope (Agent jobs only)

Per-job override on the Phase 1 runner. Do not raise defaults for non-Agent sandbox exercises.

| Field | Decision |
|---|---|
| RAM | **512 MB** (same cap) |
| Wall clock | **180 s** |
| PIDs | **64** (unchanged) |
| tmpfs | **16 MB** (unchanged) |
| Filesystem | No persistent FS; per-run workspace; submission mounted read-only |
| Network | Internal Docker network; **only** `sandbox-gateway` |
| Loop ceiling (grader, Step 4) | **8** model/tool steps · **12** tool calls · then `killed_loop` |
| Cost | Still `BudgetEnforcer` (tokens + sandbox time). Wall-clock is **information, not a pass gate** (spec §7.7) |

---

## Tool allowlist v1

Tools **execute inside the sandbox**. Each call is logged (`name`, `args`, `ok`, `durationMs`). Hidden eval is never mounted (carry forward Phase 1 Step 5).

| Tool | Behaviour |
|---|---|
| `calculator` | Arithmetic expression only; no `eval` of Python |
| `json_store` | Per-run get/put; gone when the container exits |
| `fixture_fetch` | GET a path on `sandbox-gateway` (fixtures). Host/path must match the allowlist. **No arbitrary URLs** |

**Not in v1:** shell, subprocess, raw sockets, real email/SMS, public web search, writes outside tmpfs, extra env vars.

G2’s simulated `send_email` stays on the Guardrails harness. It is not an Agent v1 tool.

Win/fail for Agent exercises is **class A events on the tool log**, not a judge rating.

---

## Contests (spec §10 / §12.4)

| Field | Decision |
|---|---|
| Eligibility | **Pro only.** Free sees a locked CTA; cannot enter |
| Anti-cheat v1 | Problem **pool** + **per-user sample** (`sample_seed`) + **time-box** |
| Paste-pattern telemetry | **Out of v1** — needs client instrumentation and a false-positive policy. Defer; do not block Step 10 |
| Hints | **Off** for contest attempts |
| Fair-use | Contest submits **count** toward Pro 60 / 30d. No unlimited contest lane |
| Season v1 | One dogfood window is enough to call contests “running” (Step 10 / 12) |
| Ranking | Sum of sampled item scores; elapsed time as tie-break |
| Identity | Opt-in public profile slug (Phase 1). Unpublished users do not appear on boards |

---

## Catalogue mix (50 → 150)

Locked targets (exact publish counts for Step 11). Bands may ship early; do not swap simulators without a review.

| Band | Phase 1 | Phase 2 target | Delta |
|---|---|---|---|
| RAG | 10 | **25** | +15 |
| Prompt Engineering | 10 | **20** | +10 |
| Evaluation | 15 | **30** | +15 |
| Guardrails | 15 | **30** | +15 |
| Agent & Tool Use | 0 | **25** | +25 |
| Benchmark Playground | 0 | **20** | +20 |
| **Total** | **50** | **150** | **+100** |

RAG+Prompt+Agent+Benchmark = 90. Eval 30 / Guardrails 30.

First slugs (names freeze in Steps 3 and 6, not here): **A1** Call the Right Tool · **B1** Two Harnesses, One Score.

---

## Security review (Step 2)

| Role | Owner |
|---|---|
| Engineering lead | Signs the Agent addendum on [sandbox-security-checklist.md](./sandbox-security-checklist.md) before Step 3 wires A1 |
| Scope | Escape, egress, tool amplification (loop + fixture_fetch), hidden-eval mount, secrets in env |

Same bar as Phase 1 Step 4. Lightweight internal review is enough; do not wait for an external audit.

---

## Step 1 sequencing

| Track | Next step | Notes |
|---|---|---|
| Infrastructure | **Step 2 — Agent runtime** | Only current `doing` track. Extend gVisor sandbox; do not build Firecracker |
| Harness | Step 3 — Agent harness + A1 | Blocked on Step 2 |
| Benchmark | Step 6 | Blocked on A1 go/no-go (Step 3) |
| Contests / boards / paths | Steps 8–10 | After both simulators have a first exercise |

**Team agrees:** Step 2 is next. Do not start Benchmark, contests, or catalogue binge from this file.

---

## Implementation constants (for Steps 2–4 and 10)

Source of truth for Agent runtime and contest gates:

```
AGENT_SANDBOX_MAX_MEMORY_MB=512
AGENT_SANDBOX_MAX_WALL_CLOCK_S=180
AGENT_MAX_STEPS=8
AGENT_MAX_TOOL_CALLS=12
AGENT_TOOLS=calculator,json_store,fixture_fetch
CONTEST_PRO_ONLY=true
CONTEST_HINTS=off
CONTEST_COUNTS_TOWARD_FAIR_USE=true
PHASE2_CATALOGUE_TARGET=150
```
