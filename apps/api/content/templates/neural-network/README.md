# Neural Network exercise template

Create `apps/api/content/exercises/<slug>/` with:

- `meta.json` — `"simulator": "neural_network"` and grader archetype `nn-n1` (N1 learning-curve diagnosis)
- `submissionSchema` — `overfitRun`, `diagnosis`, `nextKnob` enums (defaults should be the near-miss)
- `eval_public.json` — public brief questions only
- `eval_hidden.json` — frozen epoch curves per run, `overfitRun`, `acceptedKnobs`, unique `HIDDEN_EVAL_*_CANARY_PHRASE`
- `solution/reference.json` / `solution/near-miss.json`

Grade is **class A on frozen curves**. No GPU, no training jobs, no model downloads at grade time.

Hidden eval fields:

- `targetRun` — gold run id
- `expectedDiagnosis` — `overfitting` | `underfitting` | `good_fit`
- `acceptedKnobs` — list of passing `nextKnob` values
- `runs[]` — frozen epoch curves

Slice (Step 10): `nn-001` … `nn-005` — Easy/Medium/Hard mix, all use archetype `nn-n1`.
