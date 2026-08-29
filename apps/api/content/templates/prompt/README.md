# Prompt Engineering exercise template

Create `apps/api/content/exercises/<slug>/` with:

- `meta.json` — `"simulator": "prompt_engineering"`, `"graderArchetype": "pe-p1"`
- `eval_public.json`, `eval_hidden.json` (PeItem shape with `gold` object)
- `solution/reference.json` — `{ "systemPrompt", "fewShotBlock" }`
- `solution/near-miss.json` — weak prompt contract

No corpus file required.
