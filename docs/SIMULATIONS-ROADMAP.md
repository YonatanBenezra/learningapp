# AI Engineering Simulations — Roadmap

**Project:** LabPath / B2C practice platform  
**Last updated:** August 22, 2026  
**Direction:** Yonatan Benezra  

Simulations are **hands-on scenarios** (not MCQ-only): users change settings or decisions and see outcomes. They extend the core loop **assess → practice → feedback**.

---

## Status legend

| Status | Meaning |
|--------|---------|
| **POC — in scope** | Selected for the first proof-of-concept build |
| **Planned** | Agreed for a later wave; not in POC |
| **Backlog** | Valuable; priority and timing TBD |
| **Not started** | No implementation in repo yet |

---

## POC scope (current)

Yonatan (Aug 22, 2026): start with **three easy simulations** for POC, plus **Guardrails** if feasible.

| # | Simulation | POC | Status | Notes |
|---|------------|-----|--------|-------|
| 1 | [Prompt Lab](#1-prompt-lab) | Yes | **POC — shipped** | Easiest to build; useful at all levels |
| 2 | [Vector Playground](#2-vector-playground) | Yes | **POC — shipped** | Visual, beginner-friendly |
| 3 | [RAG Pipeline](#3-rag-pipeline) | Yes | **POC — shipped** | Third POC sim; core to assessment topics (simplified scope for v0) |
| 4 | [Guardrails Simulator](#8-guardrails-simulator) | Yes | **POC — shipped** | Security / trust; requested for POC |

All other simulations below are **planned** or **backlog** — not in the first POC.

---

## Full simulation catalog

### Wave 1 — Core (P0)

| # | Simulation | Priority | POC | Status | One-line description |
|---|------------|----------|-----|--------|----------------------|
| 1 | Prompt Lab | P0 | Yes | **POC — shipped** | Same task, different prompts; compare outputs side by side |
| 2 | RAG Pipeline | P0 | Yes | **POC — shipped** | Chunk size, top-k, rerank; see retrieved context and answer change |
| 3 | Agent Tool-Use | P0 | No | Planned | Plan/fix tool-call sequences for multi-step agent goals |

### Wave 2 — Depth (P1)

| # | Simulation | Priority | POC | Status | One-line description |
|---|------------|----------|-----|--------|----------------------|
| 4 | LLM Evaluation | P1 | No | Planned | Small eval sets, rubrics, metric breakdown after assessment |
| 5 | Production Debug | P1 | No | Planned | Triage wrong answers, latency, retrieval failures |
| 8 | Guardrails Simulator | P1 | Yes | **POC — shipped** | Jailbreak / unsafe prompts; filters and output checks |

### Wave 3 — Extended (P2)

| # | Simulation | Priority | POC | Status | One-line description |
|---|------------|----------|-----|--------|----------------------|
| 6 | MLOps Lifecycle | P2 | No | Planned | Model versioning, deploy, rollback, monitoring (aligns with diagnostic) |
| 7 | Vector Playground | P2 | Yes | **POC — shipped** | Embedding similarity and ranked retrieval (visual) |

### Backlog — Future tracks

| # | Simulation | Priority | POC | Status | One-line description |
|---|------------|----------|-----|--------|----------------------|
| 9 | Data Poisoning | — | No | Backlog | Poisoned RAG docs or bad samples; trust / retrieval failure |
| 10 | Neural Network Builder | — | No | Backlog | ML foundations track; heavier build — after core LLM sims |
| 11 | Multi-Agent Workflow | — | No | Backlog | Research + writer + reviewer agent orchestration |
| 12 | Cost & Latency Tradeoff | — | No | Backlog | Model size, caching, context length vs cost/quality |

---

## Simulation details

### 1. Prompt Lab

- **Teaches:** Prompt clarity, few-shot, chain-of-thought, structured JSON output  
- **User actions:** Edit prompt templates; run same input; compare outputs  
- **Aligns with:** Prompt Engineering problems, diagnostic MCQs  

### 2. Vector Playground

- **Teaches:** Embeddings, cosine similarity, false retrieval  
- **User actions:** Query against 2–3 docs; see scores and ranked chunks  
- **Aligns with:** RAG fundamentals in assessment  

### 3. RAG Pipeline

- **Teaches:** Chunking, retrieval, grounding, hallucination reduction  
- **User actions:** Tune chunk size, top-k, reranking; ask fixed questions  
- **Aligns with:** RAG-heavy assessment + practice topics  

### 4. Agent Tool-Use

- **Teaches:** ReAct, tool selection, planning, observation loop  
- **User actions:** Choose or fix tool order for a multi-step goal  
- **Aligns with:** Agents section in diagnostic assessment  

### 5. LLM Evaluation

- **Teaches:** Eval design, limits of n-gram metrics, LLM-as-judge calibration  
- **User actions:** Pick metrics/rubrics; interpret scores on a tiny test set  
- **Aligns with:** Natural follow-up after skill assessment result  

### 6. Production Debug

- **Teaches:** Incident triage in production AI systems  
- **User actions:** Inspect logs, retrieval, prompt version; find root cause  
- **Aligns with:** Job-ready skills beyond theory  

### 7. MLOps Lifecycle

- **Teaches:** Registry, deployment, drift, rollback  
- **User actions:** Deploy v2, adjust traffic, respond to alerts  
- **Aligns with:** MLOps questions in diagnostic assessment  

### 8. Guardrails Simulator

- **Teaches:** Safety filters, system prompts, output validation  
- **User actions:** Configure guardrails; test adversarial / unsafe inputs  
- **Aligns with:** Production trust & security (Yonatan POC request)  

### 9. Data Poisoning

- **Teaches:** Training and retrieval integrity attacks  
- **User actions:** Inject bad documents; observe retrieval / answer drift  

### 10. Neural Network Builder

- **Teaches:** Layer stacking, basic architecture intuition  
- **User actions:** Drag/drop or configure layers; see forward pass sketch  
- **Note:** Separate “ML foundations” track; defer until core LLM sims ship  

---

## Implementation status (repo)

| Simulation | Code / routes | Notes |
|------------|---------------|-------|
| Prompt Lab | **P0 — live LLM + output grading** | Real OpenRouter run · structural + AI rubric · `SimulationSubmission` persisted · modern lab UI at `/simulations/prompt-lab` |
| Vector Playground | **P0 — real embeddings + cosine rank** | OpenRouter/local embeddings · chunk cache · `SimulationSubmission` · lab UI at `/simulations/vector-playground` |
| RAG Pipeline | **POC — shipped** | `GET/POST /simulations/rag-pipeline` · `/simulations/rag-pipeline` |
| Guardrails Simulator | **POC — shipped** | `GET/POST /simulations/guardrails` · `/simulations/guardrails` |
| Agent Tool-Use | Not started | — |
| LLM Evaluation | Not started | — |
| Production Debug | Not started | — |
| MLOps Lifecycle | Not started | — |
| Data Poisoning | Not started | — |
| Neural Network Builder | Not started | — |

**Existing lab infra (reuse later):** code execution, terminal, SOC, and network simulators under `apps/api/src/modules/labs/` — oriented to legacy exercises; not yet wired as AI-engineering simulations above.

---

## Suggested build order (after POC)

1. Ship POC four: Prompt Lab → Vector Playground → RAG Pipeline (minimal) → Guardrails (minimal)  
2. Agent Tool-Use  
3. LLM Evaluation + Production Debug  
4. MLOps Lifecycle  
5. Backlog items as capacity allows  

---

## References

- Product MVP: [MVP-AI-Engineering-Platform-Requirements.md](./MVP-AI-Engineering-Platform-Requirements.md)  
- Assessment topics: `apps/api/src/modules/assessments/diagnosticAssessment.seed.ts`  
- Practice problems: `apps/api/src/modules/problems/problems.seed.ts`  
