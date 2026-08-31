# Agent exercise template

Create `apps/api/content/exercises/<slug>/` with:

- `meta.json` — `"simulator": "agent"` and a grader archetype:
  - `agent-a1` tool hits (A1)
  - `agent-a2` error recovery (A2)
  - `agent-a3` calculator before json_store (A3)
  - `agent-a4` call budget (A4, A5) — `thresholds.call_budget` documents the cap; the slug map in `agent.options.ts` is the grade source
- `submissionSchema` — `{ "source": "<python>" }` plus optional `systemPrompt` / `toolSchemas`
- `eval_public.json` / `eval_hidden.json` — AgentItem (`question` + `gold.tool` / `gold.args`), unique `HIDDEN_EVAL_*_CANARY_PHRASE`. Optional `repeat` duplicates the instruction in `tasks.json` only (not gold).
- `solution/reference.json` / `solution/near-miss.json` — `{ "source": "..." }`

The harness writes `tasks.json` (instructions only — no gold, no canaries). Grade is **class A on the tool log**, not a judge.

Ceilings: **8 steps / 12 tool calls** → `killed_loop`. Per-exercise call budgets are tighter. Cost still hits `BudgetEnforcer`. Wall-clock is information. Skills stay on the graph (`tool-schema`, `planning`, `error-recovery`, `loop-control`, `cost-engineering`).

See `agt-001` … `agt-005`.
