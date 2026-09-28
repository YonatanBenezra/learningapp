# RAG Simulator — ডিজাইন গাইড (Bangla)

> **Scope:** LabPath v1 — প্রথমে শুধু **RAG** simulator। Guardrails পরে; Evaluation phase 2।  
> **উদ্দেশ্য:** Industry-grade RAG practice — hidden test set, deterministic metrics, trace, actionable feedback।

---

## ১. RAG Simulator মানে কী?

RAG simulator হলো **একটা grading environment**, শুধু tutorial নয়।

- Learner **config বা prompt** submit করে (chunk size, top-k, generation prompt ইত্যাদি)।
- Platform **লুকানো Q/A set**-এ run করে (public sample শুধু demo — pass/fail এর basis নয়)।
- **Scorecard + failing cases + failure class** ফেরত দেয় — LeetCode-এর hidden test-এর মতো, কিন্তু retrieval/grounding metrics সহ।

Production-এ যা debug করতে হয় (chunk boundary, recall, citation, cost) — সেটাই এখানে **হাতে-কলমে**।

---

## ২. “Training toy” vs Industry-grade RAG simulator

| দিক | সাধারণ toy / demo | Industry-grade (LabPath লক্ষ্য) |
|-----|-------------------|----------------------------------|
| Eval | Public docs-এ eyeball | **Hidden eval set** — API/trace-এ leak নেই |
| Score | “Looks good” | **Threshold + metrics** (recall@k, tokens, nDCG, citation rules) |
| Debug | Log নেই | **Trace:** chunks + scores, prompts, tokens, cost |
| Pass/fail | Subjective | **Class A deterministic gate** + প্রয়োজনে calibrated judge (Class B) |
| Feedback | Generic error | **৩ worst case + taxonomy** (`chunk-too-large`, `hallucinated-citation`) |
| Cost | Ignore | **Budget kill** — token/cost ceiling exceed করলে clear fail |
| Stability | Model randomness | Frozen/cached where possible; re-grade ≥99% same verdict |

**Industry reference (idea/UI, content copy নয়):** LangSmith / Langfuse traces, LeetCode problem layout, RAGAS-style metric vocabulary।

---

## ৩. Exercise progression (R1 → R4)

Published catalogue-তে এখন **৫টি RAG** exercise (POC core + sandbox):

| ID | নাম | Learner কী control করে | মূল metric / gate |
|----|-----|------------------------|-------------------|
| **R1** | Chunk It Right | chunk size, overlap, split strategy | recall@5 ≥ 0.80 (Class A) |
| **R2** | The Cost Ceiling | top-k, rerank, chunk size | tokens ≤ budget + recall (Class A); correctness band (Class B) |
| **R3** | The Citation Contract | **generation prompt** (retrieval fixed) | citation format, valid chunk IDs, gold-span overlap, refusal rules |
| **R4** | Rerank or Re-think | reranker, top-n, query rewrite | nDCG@5 gain, context token cap, model-call cap |
| **R9** | Python retriever | sandbox **Python** source | custom retriever code vs hidden set |

**Flagship demo:** R3 — grounding + citation + refusal।

---

## ৪. Result কীভাবে আসবে (grading flow)

```
Submit → Validate (schema/budget)
      → Queue (BullMQ worker)
      → Execute on HIDDEN eval
      → Measure metrics
      → [Judge if Class B needed]
      → Pass / Fail / Inconclusive
      → Scorecard + 3 failing samples + failure class
```

### Learner যা দেখবে (Workspace — ডান panel “Test Result”)

1. **Verdict:** `pass` | `fail` | `inconclusive` (measurement noise — attempt consume নাও হতে পারে)  
2. **Scorecard:** প্রতিটি metric → তোমার value, threshold, per-metric pass/fail  
3. **Failing cases (max ~3):** question, expected behaviour, তোমার system actually কী করল  
4. **Failure class:** e.g. `retrieval:chunk-too-large`, `grounding:citation-not-in-source`  
5. **Links:** Run detail, **Trace** (full instrumentation)

### Trace page-এ extra detail

- Retrieved **chunks + similarity scores**  
- **Top-k**, chunk count  
- **Tokens in/out**, **cost (EUR micros)**  
- RAG questions অনুযায়ী **query blocks** (retrieved passages)

Hidden gold answers / পুরো hidden set **কখনো** UI-তে যায় না — anti-cheat।

---

## ৫. Visual design — screen by screen

### ৫.১ Simulators / Problems (catalogue)

- **Dark theme**, card grid (LabPath `lp-sim-*`, `lp-ex-*`)  
- Card: simulator badge **RAG**, difficulty (Easy/Medium/Hard), title, skill tags  
- Filter: track = RAG, difficulty, search  
- CTA: exercise open → workspace

**Industry feel:** LeetCode problem list — clean, scannable, no video-course clutter。

### ৫.২ Workspace (মূল screen — ৩ pane)

Spec অনুযায়ী layout:

```
┌─────────────────┬──────────────────────────┬─────────────────┐
│  Brief (বাম)    │  Submission (মাঝে)       │  Test Result    │
│  Goal, constraints│  Form / prompt / code  │  (ডান)          │
│  Hints          │  Simulation Lab (optional)│  Scorecard      │
│  Public sample  │  Submit                   │  Failing cases  │
└─────────────────┴──────────────────────────┴─────────────────┘
```

**R1/R2/R4 — centre panel**

- Structured **form fields:** chunkSize, overlap, splitStrategy, topK, rerank…  
- Small **pipeline strip:** Corpus → Chunk → Retrieve → Grade  
- **RAG summary chips:** current knob values live update

**R3 — centre panel**

- **Prompt editor** (retrieval fixed)  
- Citation/refusal rules brief-এ স্পষ্ট

**R9 — centre panel**

- **Python editor** (`retriever.py` style) — sandbox run

**Optional: Simulation Lab (RAG, non-sandbox)**

- Tabs: Corpus / Chunks / Query / Generate (preview only — grade hidden set-এ)  
- Submit still main path; lab = debug intuition

**Visual tone**

- Professional “engineering gym” — orange/teal accent, panels, monospace for code  
- Mobile: panels stack; desktop: resizable split (`WorkspaceSplit`)

### ৫.৩ Submit এর পর UX

- Status: `queued` → `running` → `succeeded` (SSE/poll)  
- Verdict badge color-coded  
- Metrics table + tooltips (recall@k, nDCG ইত্যাদি short explain)  
- Fail হলে **actionable** copy — “৩টা missed question-এ chunk mid-sentence split”

### ৫.৪ Trace view

- Hero: “Retrieval steps for this run”  
- Stats row: Chunks, Top-k, Tokens, Cost  
- Per-query: question + ranked passages (scores visible)  
- Raw payload (power users) — Pro gate থাকতে পারে product policy অনুযায়ী

---

## ৬. Wireframe-level component map (implementation)

| UI block | Repo (web) |
|----------|------------|
| Catalogue | `features/problems/` |
| Workspace shell | `features/workspace/components/workspace-shell.tsx` |
| Brief | `brief-panel.tsx` |
| Submit surface | `submission-surface.tsx` |
| RAG lab | `rag-lab-panel.tsx` |
| Results | `run-panel.tsx`, `scorecard-intervals.tsx` |
| Trace | `features/traces/components/trace-view.tsx` |
| Config | `config/simulators.ts`, `published-slugs.json` (API) |

---

## ৭. Design checklist (RAG v1 sign-off)

- [ ] R1 onboarding: **≤15 min** first pass feel  
- [ ] Hidden set never in network tab / trace leak test green  
- [ ] Fail state always shows **≥1 failure class** + **≥1 failing case**  
- [ ] Trace must answer: “কোন chunk retrieve হয়েছিল এবং score কত?”  
- [ ] Cost/token visible where R2 relevant  
- [ ] R3: citation + refusal gates understandable from brief alone  
- [ ] Loading: no silent hang (queued >30s warning if worker down)

---

## ৮. পরের ধাপ (design → build order)

1. **R1 end-to-end** polish (brief + form + scorecard + trace)  
2. **R3** flagship UX (prompt editor + citation feedback)  
3. R2 cost frontier visualization (quality vs tokens chart — spec mentions)  
4. R9 sandbox UX + error messages  
5. Mockups/Figma: workspace ৩-pane + trace — client sign-off এর জন্য

---

## ৯. সংক্ষিপ্ত সারাংশ

- **Design:** LeetCode-style workspace + Langfuse-style trace + deterministic scorecard।  
- **Result:** Worker-grade hidden eval → metrics → pass/fail → worst cases + taxonomy।  
- **Visual:** Dark, ৩-pane, minimal distraction, engineering metrics upfront।  

বিস্তারিত product rules: `Labpath specification/LabPath-Specification.md` — §6 (RAG), §7 (grading), §0.7 (UI scope)।
