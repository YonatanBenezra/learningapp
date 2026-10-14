# LabPath Practice Report  
## End-to-End Completion of the Published Problem Catalogue

| | |
|---|---|
| **Author** | Jewel Mia |
| **Date** | 12 October 2026 |
| **Platform** | LabPath — [labpath-prod](http://34.165.94.58/) |
| **Scope** | All **30** live problems (18 RAG · 11 Guardrails · 1 Agent) |

---

## Executive summary

I completed the full published LabPath catalogue: thirty graded exercises across retrieval (RAG), LLM security (Guardrails), and one agentic workflow lab. Each item runs inside a **simulator** with **automated graders** and a **hidden evaluation set**; pass/fail is objective, not self-assessed.

This report documents (1) **what the problems are like** in practice, (2) **how I worked through the catalogue**, (3) **where I lost time**, and (4) **what I took away** as an engineer shipping RAG and guarded LLM systems.

---

## 1. What LabPath problems are like (format & expectations)

Across tracks, problems share the same shape — closer to a **production ticket + staging environment** than a quiz.

**Structure**

- **Brief** — Scenario written like an internal launch review (policy KB, concierge bot, agent with tools, eval regression, etc.).
- **Simulator** — Interactive workspace: RAG pipeline panels (corpus, chunking, query, generate), guardrails levels (L1/L2/L3), or agent/tool loop.
- **Submission** — Typed JSON (chunk parameters, prompts, attack text, page content, retriever code, defence rules — depending on problem).
- **Grading** — Class **A** gates bind shipping; some class B metrics are advisory. Metrics include recall@k, nDCG, citation format, refusal counts, levels won, Wilson thresholds, tool-call logs, loop limits.
- **Feedback** — A small sample of **failing cases** rotates after failed submits; the full **hidden set** decides pass.

**Difficulty**

- **Easy (E)** — Introduce one idea (chunk boundaries, direct injection, top-k).
- **Medium (M)** — Trade-offs (cost vs recall, citations + refusals, indirect injection, tool smuggling).
- **Hard (H)** — Production edge cases (hybrid retrieval, adversarial corpus, Wilson gates, multi-turn jailbreak, custom retriever code, eval slice regression).

**What “done” means**

There is no partial credit on class A gates. A submit can look good on **public** smoke cases and still fail **hidden** eval until the approach — not a single parameter tweak — is correct.

---

## 2. RAG track (18 problems) — nature of the work

RAG problems walk the lifecycle of an internal **policy / KB assistant**: fix retrieval first, then generation policy, then cost and eval discipline, then advanced retrieval and regression control.

| Phase | Representative problems | What they felt like |
|------:|-------------------------|---------------------|
| 1 | Corpus Chunk Boundaries; Overlap & Sliding Windows; Retrieval Top-K; Metadata Scope & Window Fit | **Pipeline tuning.** Wrong chunk boundaries meant answers never appeared in context despite a fine embedding model. Overlap and heading-aware splits were the lever. Top-k introduced token budget awareness early. |
| 2 | Recall@k SLA on Policy KB; Cost-Capped Retrieval; Rate & Spend Abuse Under Load | **SLA + FinOps.** Ticket-style questions; optimising recall alone failed when mean prompt tokens or spend caps bound the gate. |
| 3 | Citation-Grounded Answers; Stale Index & Retriever Refresh; Public vs Hidden Eval Discipline | **Generation policy & ops.** Retrieval frozen; only the generation prompt moved. Required `[chunk:id]` citations, grounded answers, and refusals on unanswerable items — without over-refusing answerable ones. Re-index scenarios forced re-tuning. Hidden vs public eval taught not to overfit smoke tests. |
| 4–6 | Two-Stage Retrieve + Rerank; Query Routing; Hybrid Rank Boost; Custom Retriever; Context Packing; Multi-Hop Decomposition; Adversarial Corpus / Span Evasion; Eval Slice Regression Gate | **Production RAG.** Rerank and hybrid trade latency and cost for quality. Sandbox retriever meant writing code, not sliders. Later items resembled **incident response**: adversarial docs, multi-hop queries, and **slice regressions** (aggregate metric up, SKU slice down). |

**RAG arc (personal):** boundaries → measurable recall → cost → citations/refusal → rerank/hybrid/code → adversarial & regression gates.

---

## 3. Guardrails track (11 problems) — nature of the work

Guardrails mirror **pre-release security reviews**: break the system (red), abuse tools and data paths (orange), then design controls that survive scale (blue).

| Mode | Count | What problems were like |
|------|------:|---------------------------|
| **G1 — Red-team** | 4 | **Concierge-style bots** with layered defences (baseline prompt, hardened prompt, output filter). Submit an **attack prompt**; pass when all **three levels** are won. Scenarios: direct exfiltration, indirect injection via retrieved text, encoding/obfuscation, instructions hidden in documents. |
| **G2 — Tool / data abuse** | 2 | **Agent + tools.** Attacks live in **page content** or payloads the model reads before acting — e.g. smuggling BCC on `send_email` while the user request stays benign, or triggering **PII/secret canaries**. Closer to real agent incidents than chat-only jailbreaks. |
| **G3 — Blue-team** | 5 | **Control design.** Refuse unsafe use without breaking benign UX; stack **rules + judge**; tune **Wilson-style** FP/FN gates at scale; map controls and preserve **benign pass**; handle **multi-turn jailbreak escalation**. Felt like tuning monitors and policies, not crafting a single clever prompt. |

**Guardrails arc:** learn attack surfaces on G1/G2, then implement defences on G3 with explicit trade-offs.

---

## 4. Agent track (1 problem)

| Problem | What it was like |
|---------|------------------|
| **Agentic Loop with Grader Stop** | **Tool loop under constraints.** Tasks include malformed tool calls; the agent must **recover once** (e.g. calculator fallback args) then **stop** — no infinite retries or loop kill. Pass/fail read from structured tool logs (failed call → successful call with different args, no `killed_loop`). |

---

## 5. Method — how I completed the catalogue

1. **Ordering** — RAG phases largely in catalogue order; Guardrails G1 → G2 → G3; agent lab last. Short breaks on G1 when RAG citation work needed fresh eyes.
2. **Submission log** — Per problem: change made → metric movement → public/hidden result. Prevented repeated dead-end submits.
3. **Gate-first review** — Read class A gates before editing (especially citation + dual refusal metrics on R3).
4. **Session limits** — Hard items (Wilson gate, span evasion, multi-hop, regression gate) split across sessions instead of unbounded trial-and-error.

---

## 6. Challenges encountered

| Area | Issue |
|------|--------|
| Hidden eval | Public pass with hidden fail until strategy changed (not one knob). |
| RAG generation | Balancing unanswerable refusals vs answerable false refusals on citation problems. |
| Guardrails | Attacks that cleared L1 failed L2/L3 until redesigned per defence layer. |
| Metrics | Recall-only tuning broke downstream cost and spend-cap problems. |
| G3 controls | Small threshold shifts on Wilson / benign-pass problems — similar to production alerting. |
| Environment | Production VM auth/cookies cost session time (operational, separate from exercise design). |

---

## 7. What I learned from solving the problems

Below is what stuck after clearing the full catalogue — grouped by track, then habits I changed in my own work.

### 7.1 RAG (18 problems)

| Topic | What I learned |
|-------|----------------|
| **Chunking** | Bad boundaries fail silently: answers sit in the corpus but never land in retrieved chunks. Heading-aware and sentence splits beat “pick 512 tokens” defaults. Overlap helps only after boundaries make sense. |
| **Retrieval metrics** | recall@k and nDCG are operational contracts, not leaderboard scores. I log (k, recall, tokens) per corpus section instead of one global k. |
| **Cost & load** | Recall and spend pull in opposite directions. Problems with token caps and rate limits taught me to design retrieval for **p95 cost**, not best-case recall. |
| **Generation policy** | With retrieval fixed, launch risk moves to the **generation prompt**: citation format (`[chunk:id]`), grounded spans, and refusal when context is insufficient — without refusing answerable tickets. |
| **Eval discipline** | Public smoke cases are necessary but not sufficient. Hidden eval and “public vs hidden” problems trained me not to ship after one green dashboard. |
| **Rerank & hybrid** | Second-stage rerank and hybrid boost help specific slices; they add latency and call budget. Aggregate nDCG can improve while a **SKU or policy slice regresses** — slice gates matter. |
| **Custom retriever** | Writing retriever logic in the sandbox forced me to own scoring and filtering explicitly instead of hiding behind defaults. |
| **Adversarial & multi-hop** | Adversarial corpus and span-evasion items mirror doc poisoning and awkward phrasing in real KBs. Multi-hop decomposition is a product decision, not just a prompt trick. |

### 7.2 Guardrails (11 problems)

| Topic | What I learned |
|-------|----------------|
| **G1 — Direct / indirect attacks** | One clever jailbreak string rarely survives three defence layers. L1, L2, and L3 need **different** attack shapes (instruction override vs retrieval poison vs encoding). |
| **G2 — Tools & data** | The dangerous instruction often lives in **content the agent reads** (page body, tool context), not the user chat line. BCC smuggling and canary exfil are about **tool schemas and validators**, not the chat UI. |
| **G3 — Controls at scale** | Blue-team work is policy + measurement: rules plus judge, Wilson-style FP/FN trade-offs, benign pass rates, multi-turn escalation. It feels like tuning **monitors and runbooks**, not winning a single prompt duel. |
| **Security mindset** | Offence (G1/G2) made G3 design concrete — I cannot tune Wilson gates well without knowing what attackers actually try. |

### 7.3 Agent (1 problem)

| Topic | What I learned |
|-------|----------------|
| **Loop control** | Agents need explicit **recover once, then stop** semantics. Retrying the same failing tool call triggers loop kills; recovery means **different args**, verified in structured logs. |
| **Observability** | Pass/fail on agent tasks came from tool-call traces, not answer text alone — same as production debugging. |

### 7.4 Process & professional practice

- **Gates are the spec** — Class A metrics listed in the brief beat my intuition about “good enough.”
- **Failing cases > generic advice** — The simulator snippets after a miss told me exactly which query class or attack variant still broke.
- **Submission log** — One line per attempt (change → metric → pass/fail) saved hours on Hard problems and is now how I document internal RAG experiments.
- **Evidence for reviews** — Finishing all 30 is a map of **skills touched** (chunking through Wilson gates), not a certificate — useful in 1:1s with concrete examples.

---

## 8. Conclusion

I **completed all 30 published LabPath problems** and prepared this report from that full run. The problems are uniformly **simulator-based, gate-graded, and hidden-eval backed** — demanding in the moment, but clear in retrospect about what still failed.

