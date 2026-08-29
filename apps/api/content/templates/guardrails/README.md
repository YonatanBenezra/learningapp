# Guardrails exercise template

Create `apps/api/content/exercises/<slug>/` with:

- `meta.json` — `"simulator": "guardrails"`, `"graderArchetype": "guard-g1"` (or `guard-g2` / `guard-g3`)
- `eval_public.json`, `eval_hidden.json` (G1 uses `{ canary, levels, leak }` object)
- `solution/reference.json` / `solution/near-miss.json`

G1 family uses `{ "attackPrompt": "..." }`.
