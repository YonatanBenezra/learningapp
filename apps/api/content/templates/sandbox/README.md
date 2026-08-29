# Sandbox (BYOC) exercise template

Create `apps/api/content/exercises/<slug>/` with:

- `meta.json` — `"simulator": "rag"`, `"graderArchetype": "rag-sandbox"`
- `submissionSchema` — `{ "source": "<python>" }`
- `eval_public.json` / `eval_hidden.json` — RAG hidden items + unique `HIDDEN_EVAL_*_CANARY_PHRASE`
- `corpus.json` or `"corpusFile": "shared"`
- `solution/reference.json` / `solution/near-miss.json` — `{ "source": "..." }`

Learner code reads `input.json` next to `main.py` (corpus + questions only). Hidden gold and canaries stay on the worker.

See `rag-009-python-retriever` for the first sandbox-backed exercise.
