# Fine-tuning exercise template

Create `apps/api/content/exercises/<slug>/` with:

- `meta.json` — `"simulator": "fine_tuning"` and grader archetype `ft-f1` … `ft-f5`
- `eval_public.json` — public brief questions only
- `eval_hidden.json` — frozen cost tables, dataset rows, or tuned-model eval traces; unique `HIDDEN_EVAL_*_CANARY_PHRASE`
- `solution/reference.json` / `solution/near-miss.json`

Grade is **class A on frozen artifacts**. No LoRA jobs, no model downloads, no dataset uploads at grade time.

Archetypes:

| Archetype | Shape | Submission fields |
|---|---|---|
| `ft-f1` | Tune vs prompt economics | `approachCall`, `economicsCall` |
| `ft-f2` / `ft-f5` | Dataset prep | `issue`, `rowIds` |
| `ft-f3` | Tuned-model eval (Benchmark B1 reuse) | `rankingCall`, `deltaCause` |
| `ft-f4` | Adapter choice | `adapterChoice`, `rationale` |

Slice (Step 11): `ft-001` … `ft-005` — Easy/Medium/Hard mix.
