# RAG exercise template

Create `apps/api/content/exercises/<slug>/` with:

- `meta.json` — set `"simulator": "rag"`, `"graderArchetype": "rag-r1"` (or `rag-r2` / `rag-r3` / `rag-r4` / `rag-sandbox`)
- `eval_public.json` — public sample questions
- `eval_hidden.json` — hidden eval set + unique `HIDDEN_EVAL_*_CANARY_PHRASE`
- `corpus.json` or `"corpusFile": "shared"` in meta
- `solution/reference.json` — passing submission payload
- `solution/near-miss.json` — failing submission payload

Bump `"version"` in meta when content changes. Re-run `npm run content:validate` and `npm run prisma:seed`.
