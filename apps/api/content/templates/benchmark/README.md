# Benchmark exercise template

Create `apps/api/content/exercises/<slug>/` with:

- `meta.json` — `"simulator": "benchmark"` and a grader archetype:
  - `bench-b1` two frozen harness traces, one score (B1)
  - `bench-b2` same checkpoint, decode/wrapper variance (B2)
  - `bench-b3` train/eval overlap contamination (B3)
- `submissionSchema` — `rankingCall` + `deltaCause` enums (defaults should be the near-miss)
- `eval_public.json` — public brief questions only (no hidden prompts)
- `eval_hidden.json` — frozen items with `gold` / `a` / `b` predictions, harness metadata, unique `HIDDEN_EVAL_*_CANARY_PHRASE`. B3 items also carry `slice`: `clean` | `overlap`
- `solution/reference.json` / `solution/near-miss.json` — ranking + cause payload

Grade is **class A on frozen fixtures**. No live model calls, no Hugging Face downloads. Wall-clock is information, not a pass gate. Scorecards show Wilson intervals / seed / decode / slice accuracy — not a single headline %.

See `bnch-001-two-harnesses-one-score`, `bnch-002-same-checkpoint-decode`, `bnch-003-eval-overlap`.
