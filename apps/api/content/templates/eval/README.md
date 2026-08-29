# Evaluation exercise template

Create `apps/api/content/exercises/<slug>/` with:

- `meta.json` — `"simulator": "evaluation"`, `"graderArchetype": "eval-e1"` (or `eval-e2` / `eval-e3`)
- `eval_public.json`, `eval_hidden.json` (EvalItem rows + canary)
- `solution/reference.json` / `solution/near-miss.json` — payload for the archetype grader

E1 family uses `{ "suiteYaml": "..." }`.
