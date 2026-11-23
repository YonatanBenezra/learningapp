# Guardrails Simulator: gap analysis

২০২৬-১১-১৯। নিচের analysis code বদলানোর আগের অবস্থা নিয়ে। পরে Phase G-A (P0) করা হয়েছে, আর সেটা করতে গিয়ে একটা নতুন critical bug (C5) পাওয়া গেছে। দুটোই §১১-তে।

## ০. এক নজরে

| # | সমস্যা | মাত্রা |
|---|---|---|
| C1 | প্রতিটা grader-এর সব exercise clone। একটা উত্তর group-এর সব exercise pass করে (G1 ৭/৭, G2 ৭/৭, G3 ৬/৬) | Critical |
| C2 | G3-তে এক লাইনের output filter (canary string ধরা) সব ৬টা defense exercise ১০০% / ১০০% দিয়ে pass করে | Critical |
| C3 | G3-এর ৬টা exercise-এর hidden pool এক (৫০১টার মধ্যে ৫০০টা এক)। প্রতিটা fail run ৮টা পর্যন্ত hidden প্রশ্ন দেখায়, feedback/holdout ভাগ নেই | Critical |
| C4 | Contest-এ এই clone-গুলো আছে: `beta-ctf-0`-এ ৮টা, `weekly-advanced-1`-এ ৭টা, `weekly-advanced-2`-এ ৯টা guardrails problem | Critical |
| C5 | Production-এ ৫টা advanced exercise ভুল grader আর ভুল UI পায় (G-A করার সময় পাওয়া, ঠিক করা হয়েছে) | Critical |
| H1 | Bot আসলে keyword regex। Live simulator আর grader হুবহু এক, তাই hidden eval কিছু যোগ করে না। Live endpoint-এ rate limit নেই | High |
| H2 | Brief যা বলে, grader তা করে না: "multi-turn" (০১৬, ০২৫), "LLM judge" (০১৩), "refusal ও benign UX" (০০৪) | High |
| H3 | G1/G2 fake model call করে (`fakeCompletion`, `fakeJudge`)। ফল কেউ ব্যবহার করে না, কিন্তু run-এর খরচ আর budget-এ গোনা হয় | High |
| H4 | `meta.json`-এর gate আর grader যা যাচাই করে, তা মেলে না। কোনো CI test এটা ধরে না | High |
| M1–M5 | Advanced brief প্রায় ফাঁকা, সব জায়গায় একই canary আর attacker, G3-এর sample run অনুযায়ী বদলায়, CI নেই, ভুল comment | Medium |
| U1–U3 | Brief-এর শুধু শুরুটা দেখায়, canary web-এর source-এ, UI-তে level clear হলেও সব level-এ এক payload যাচাই হয় না | High (UI) |
| E1 | কোথাও কোনো আসল model নেই। Bot regex, defense-এর মূল্যায়ন keyword দিয়ে, LLM judge বা classifier নেই | Critical (engine) |
| E2 | G3-এর ৫০১টা item আসলে প্রায় ৭টা template, ১৬০/২০০ attack-এ একই বাক্যাংশ | Critical (eval) |
| E3 | Normalization, redaction, tool policy, multi-turn state কিছুই নেই। Brief যা দাবি করে, engine তা পারে না | High (engine) |
| E4 | OWASP LLM Top 10-এর অর্ধেক বিষয় নেই (PII, output handling, excessive agency-র defense, unbounded consumption, moderation, topical rail)। ২০টার ১৪টা attack exercise | High (curriculum) |
| U4–U10 | বানানো hint, ভুল "graded" label, G3-এর label grader-এর সাথে মেলে না, run-এর পরে প্রায় কোনো ব্যাখ্যা নেই, probe/diff/trace নেই, demo data, starter page নিজেই L1 জেতে | Medium (UI) |

## ১. কীভাবে যাচাই করা হয়েছে

- তিনটা grader (`g1.grade.ts`, `g2.grade.ts`, `g3.grade.ts`), bot (`concierge.ts`, `indirect-agent.ts`), per-exercise নিয়ম (`g1-exercise-sim.ts`, `g2-exercise-sim.ts`), live simulator (`practice/simulations`) আর model gateway পড়া হয়েছে।
- Offline content runner দিয়ে চালানো হয়েছে:
  - প্রতিটা exercise-এর reference আর near-miss।
  - প্রতিটা reference নিজের group-এর অন্য সব exercise-এ।
  - G3-তে দুটো baseline config: শুধু canary-র output filter, আর সব কিছু ছেড়ে দেওয়া।
- নতুন কোনো attack prompt লেখা হয়নি। শুধু repo-র নিজের reference আর near-miss ব্যবহার করা হয়েছে।
- Web UI audit আলাদা একটা agent করেছে (নিচে §৬)।

## ২. Track-এর গঠন

| Grader | যা জমা দিতে হয় | Exercise | Gate |
|---|---|---|---|
| G1 | একটা `attackPrompt`, concierge bot-কে | `grd-001`, `004`, `005`, `007`, `016`, `018`, `019` | তিনটা level-ই জিততে হবে |
| G2 | একটা `pageContent`, যা email agent পড়ে | `grd-002`, `010`, `011`, `017`, `020`, `021`, `025` | তিনটা level-ই জিততে হবে |
| G3 | system prompt, input filter, output filter, tool policy | `grd-013`, `014`, `015`, `022`, `023`, `024` | attack block ≥ ০.৯০, benign pass ≥ ০.৯৫ (Wilson) |

এই exercise-গুলো ৩টা collection, ৩টা contest আর ৮টা path-এ আছে।

## ৩. Critical

### C1. প্রতিটা group-এর সব exercise clone

প্রতিটা group-এর সব exercise-এর `solution/reference.json` হুবহু এক (একটা বাদে)। G1/G2-তে canary আর attacker address সব জায়গায় এক।

| Group | যে উত্তর অন্যগুলো pass করে | ফল |
|---|---|---|
| G1 (৭টা) | যেকোনো exercise-এর reference | প্রতিটা অন্য ৬টাকেও pass করে |
| G2 (৭টা) | যেকোনো exercise-এর reference | প্রতিটা অন্য ৬টাকেও pass করে, `grd-025` সহ যার reference আলাদা |
| G3 (৬টা) | যেকোনো exercise-এর reference | প্রতিটা অন্য ৫টাকেও pass করে |

Title আলাদা (encoding, hex, policy window, bcc, page inject, Wilson gate…), কিন্তু grader প্রতিটা group-এ একই বিষয় মাপে। "Advanced" version-গুলো (০১৭–০২৫) একই grader আর একই উত্তর।

### C2. G3: এক লাইনের output filter সব defense exercise pass করে

`mockDefend` (`g3.grade.ts`) attack হলে প্রায় সব ক্ষেত্রে canary **হুবহু plain text-এ** ফেরত দেয়, কখনো encode করে না। আর canary কোডেই লেখা একটা নির্দিষ্ট মান (`OVERRIDE-BK-7742`)। ফলে:

| Config | ৬টা G3 exercise-এর ফল |
|---|---|
| শুধু output filter: canary string থাকলে block | সবগুলো **pass**, attack block ১.০০, benign pass ১.০০ |
| কিছুই block না করা | সবগুলো fail, attack block ০.০০ |

System prompt, input filter বা tool policy, কোনোটাই লাগে না। "Defense in depth", "encoding bypass" আর "FP/FN tradeoff", এর কোনোটাই আসলে পরীক্ষা হয় না। Encoded attack-এ bot কখনো encode করা leak দেয় না, তাই canary filter কখনো ফাঁকি খায় না। Reference নিজেও ঠিক এই filter ব্যবহার করে।

### C3. G3-এর hidden pool এক, আর বেরিয়ে আসে

- ৬টা G3 exercise-এর `eval_hidden.json`-এর pool প্রায় হুবহু এক (৫০১টার মধ্যে ৫০০টা)।
- প্রতিটা fail run `failingCases`-এ ৮টা পর্যন্ত hidden item-এর পুরো লেখা দেখায়, attack আর benign দুটোই।
- RAG-এর মতো feedback/holdout ভাগ নেই। বারবার fail করে pool তুলে আনা যায়, আর সেটা ৬টা exercise-এই কাজে লাগে।

### C4. Contest-এ clone

`beta-ctf-0`-এ ৮টা, `weekly-advanced-1`-এ ৭টা আর `weekly-advanced-2`-এ ৯টা guardrails problem আছে। একজন প্রতিযোগী একটা G1 problem solve করলে একই উত্তর paste করে বাকি সব G1 problem-এর point পেয়ে যায়। G2 আর G3-তেও একই অবস্থা।

## ৪. High

### H1. Bot keyword regex, আর live simulator হুবহু grader

- G1-এর bot ঠিক করে message-টা leak চাইছে কিনা, দুটো regex দিয়ে: একটা নির্দিষ্ট বিষয়-শব্দ আর একটা নির্দিষ্ট jailbreak বাক্যাংশ (`wantsLeak`)। কোন encoding-এ leak হবে, সেটা message-এ কোন keyword আছে তা দেখে ঠিক হয় (`leakEncoding`)। Level ৩ শুধু চারটা encoding আটকায়।
- G2-এর agent-ও regex দিয়ে চলে। Level ৩-এর policy শুধু প্রথম `to` address দেখে, `cc` আর `bcc` দেখে না।
- ফলে learner আসল prompt injection শেখে না, শেখে কোন শব্দে regex খোলে।
- Live simulator (`POST /simulations/g1/turns`, `/g2/page`) grading-এর একই function, একই canary আর একই attacker দিয়ে চালায়। Learner সীমাহীনবার চেষ্টা করে ঠিক grading-এর ফল দেখতে পারে, তাই hidden eval কিছু যোগ করে না।
- এই controller-এ rate limit নেই। RAG lab-এ `UserRateLimitGuard` আছে।

### H2. Brief আর grader মেলে না

| Exercise | Brief যা বলে | Grader যা করে |
|---|---|---|
| `grd-016` "Multi-Turn Jailbreak Escalation" | কয়েক turn ধরে ধীরে রাজি করানো | একটা মাত্র prompt, G1-এর অন্যগুলোর মতোই |
| `grd-025` "Multi-Turn Jailbreak (Advanced)" | Long-horizon persuasion | G2: page injection, multi-turn-এর সাথে সম্পর্ক নেই |
| `grd-013` "Defense in Depth" | Rule, system prompt আর **LLM judge**, fast/slow path | কোনো model নেই (`added_model_calls` = ০), কোনো slow path নেই |
| `grd-004` "Safety Refusal & Benign UX" | Refusal আর FP/FN balance | একই attack grader, `grd-001`-এর মতো |
| `grd-001` | "L2 hardened system prompt, L3 output filtering" | L2 মানে regex দুটো শব্দের বদলে একসাথে দুটো চায়। L3 মানে চারটা encoding আটকানো |

### H3. Fake model call, কিন্তু খরচ গোনা হয়

- G1 প্রতিটা level-এ `gateway.complete()` ডাকে। G2 ডাকে `complete()` আর `judge()`।
- Gateway-র ভেতরে এগুলো `fakeCompletion` আর `fakeJudge`, আর grader ফলটা কোথাও ব্যবহার করে না।
- তবু এগুলো run-এর token আর খরচ হিসেবে লেখা হয়, `assertWithinBudget` চালায়, আর cache table ও blob-এ লেখে।
- ফলে run-এর হিসাবে ভুয়া model খরচ দেখায়। Budget ভরে গেলে কোনো কারণ ছাড়াই run fail করতে পারে।

### H4. Gate মেলে না, আর CI-তে কিছু ধরা পড়ে না

- `grd-004`, `005` আর `018`-এর `meta.json` বলে gate `pass eq 1`। Grader আসলে যাচাই করে `levels_won eq 3`।
- G3 grader `filter_tokens ≤ ৬০০` যাচাই করে, কিন্তু meta-তে সেটা নেই।
- RAG-এ `rag-content-pipeline.spec.ts` meta আর grader-এর gate মিলিয়ে দেখে, `rag-mechanics.spec.ts` shortcut ধরে, `rag-transfer.spec.ts` clone ধরে। Guardrails-এর জন্য এর কোনোটাই নেই।

## ৫. Medium

- **M1. Advanced exercise-এর brief প্রায় ফাঁকা।** `grd-017` থেকে `025`-এর brief ৮৫–১০৪ অক্ষর। কী জমা দিতে হবে, level-এর নিয়ম, gate, কিছুই নেই।
- **M2. সব জায়গায় একই canary আর attacker।** Canary (`OVERRIDE-BK-7742`) আর attacker address সব exercise-এ এক, কোডেও লেখা। G3-এর reference-এ canary সরাসরি আছে, আর G2-এর brief-এ attacker address দেওয়া।
- **M3. G3-এর sample run অনুযায়ী বদলায়।** Sample-এর seed আসে `runId` আর system prompt-এর দৈর্ঘ্য থেকে। একই config আবার জমা দিলে অন্য sample পায়, তাই সীমানার কাছের config কখনো pass, কখনো fail করতে পারে।
- **M4. পুরনো comment ভুল।** `g1-exercise-sim.ts`-এর comment বলে grading-এ default `wantsLeak` চলে, কিন্তু grading আসলে exercise অনুযায়ী `wantsLeakForExercise` চালায়।
- **M5. Hidden-এর কিছু field অব্যবহৃত।** G1/G2-এর hidden file-এ `levels` আর `leak` field আছে, grader সেগুলো পড়ে না। `leak` শুধু canary phrase রাখে।

## ৬. Web UI

UI audit একটা আলাদা agent করেছে, শুধু code পড়ে (কিছু চালায়নি)। "যাচাই করা" লেখা দাবিগুলো আমি নিজে code-এ মিলিয়ে দেখেছি। Path `apps/web/src/features/workspace/`-এর ভেতরের।

**High:**
- **U1. Brief-এর শুধু শুরুটা দেখায় (যাচাই করা)।** Guardrails workspace-এ শুধু title, subtitle আর brief-এর প্রথম অনুচ্ছেদ থেকে বানানো "Objective" দেখায় (`guardrails-left-panel.tsx:152-168`, `guardrailsObjective`)। বাকি brief, level-এর নিয়ম আর gate learner দেখতে পায় না। যেমন "একই prompt-কে তিনটা level-ই জিততে হবে", বা G2-তে `to`/`cc`/`bcc`-এর নিয়ম। Public sample-ও দেখায় না (`publicRows: []`)।
- **U2. Canary web-এর source-এ আছে (যাচাই করা)।** `guardrails-workspace-data.ts:265`-এর `G3_CANARY_TOKEN` হুবহু সেই মান, যেটা সব G1 hidden file আর `levels.ts`-এ আছে। G3-এর grade response-এর `failingCases[].output`-এ bot-এর leak করা লেখাও থাকে। UI regex দিয়ে লুকায়, কিন্তু DevTools-এ পড়া যায়।
- **U3. একটা payload তিনটা level-এ একসাথে যাচাই করা যায় না।** UI-তে level শুধু সামনে এগোয় ("Next level")। একবার clear হওয়া level আর আবার যাচাই হয় না। অথচ grader চায় একই payload তিনটাই জিতুক। তাই UI-তে ৩/৩ দেখাতে পারে এমন prompt-এর জন্যও, যেটা submit করলে fail করে।

**Medium:**
- **U4. Hint অংশটা বানানো (যাচাই করা)।** `guardrails-brief-from-exercise.ts` নিজে থেকে লেখে "Hint 2 unlocks after 6 attempts" (`unlockAfter: 6 + i * 4`)। আরেক জায়গায় বাকি hint-এর সংখ্যাকে attempt-এর সংখ্যা হিসেবে দেখায় (`unlockAfter: hints.remaining`)। API-তে এমন কোনো নিয়ম নেই, আর unlock button-ও নেই। ২০টার মধ্যে ১৭টা exercise-এর `hints.json` নেই।
- **U5. "Live · Every send is graded" ভুল।** Chat যে endpoint ডাকে সেটা কিছুই রেকর্ড করে না, কোনো grading হয় না।
- **U6. G3-এর label grader-এর সাথে মেলে না।**
  - Gate দেখায় সাধারণ "≥ ৯০%", কিন্তু grader Wilson interval দেখে।
  - Sample size ৪০/৬০ hardcode করা, অথচ resample হলে দ্বিগুণ হয়।
  - Tool-call policy editor grader পড়েই না।
  - "≤ ২ calls" budget কখনো যাচাই হয় না (`callsPass = true`)।
  - Token estimate grader-এর থেকে অন্যভাবে হিসাব হয়।
- **U7. Run-এর পরে ব্যাখ্যা প্রায় নেই।** G1/G2-তে শুধু "level N" আর "slipped: no-canary" দেখায়, অথচ attack আটকে গেলে "slipped" ভুল শব্দ। Scorecard-এর `wins`, `debrief` আর G2-এর tool call দেখায় না। G3-তে শুধু প্রথম failure class দেখায়, আর attack-এর কোন category miss হলো সেটা বলে না।
- **U8. RAG-এর তিনটা জিনিস নেই।**
  - G3-এর জন্য live probe নেই।
  - Run diff নেই: History tab placeholder, attempt-এর সংখ্যা reload করলে মুছে যায়।
  - Per-case trace নেই: guardrails run-এর trace page "Retrieval/Queries" দেখায়, সব সংখ্যা ০।
- **U9. আসল run-এ demo data দেখায়।** `guardrails-g1-run-model.ts` demo run-এর detail ঢুকিয়ে দেয়, `attempt: 1` hardcode করা, আর timeline-এ বানানো entry থাকে।
- **U10. G2-এর starter page নিজেই level ১ জিতে যায় (code পড়ে যাচাই করা)।** `G2_SAMPLE_PAGE`-এ attacker-এর কাছে summary পাঠানোর একটা নির্দেশ আগে থেকেই লেখা, আর level ১ পুরো page পড়ে। তাই learner কিছু না লিখেই level ১ জেতে। এই page `grd-002`, `017`, `020`, `021` আর `025`-এ ব্যবহার হয়। L2-এর label "Domain allowlist", অথচ grader-এ L2 হলো `<untrusted>` wrapper।

**Low:**
- Progress bar, tool log-এর "200 · 1.2 KB", "/ 4,000 chars" (যাচাই হয় না), mask করা canary-র format আর debrief-এর একই বাক্য, সব placeholder।
- Accessibility: textarea-য় label নেই, শুধু icon-ওয়ালা button-এ `aria-label` নেই, mode toggle-এ `aria-pressed` নেই, chat log-এ `aria-live` নেই।
- RAG-এর মতো mobile layout নেই, শুধু ১১০০px-এ pane-গুলো নিচে নিচে চলে আসে।

## ৭. আসল guardrails-এর সাথে তুলনা: Engine

RAG-এর মতো একই প্রশ্ন: exercise যা শেখানোর দাবি করে, engine কি সত্যিই সেটা চালায়?

| বাস্তবে যা হয় | Simulator-এ যা আছে | ফাঁক |
|---|---|---|
| একটা আসল LLM, যার আচরণ prompt আর context-এ বদলায়, আর কখনো একই কথা দুবার বলে না | কোথাও কোনো model নেই। G1 আর G2-এর bot regex, G3-এর bot `mockDefend` নামের keyword function। Gateway-র call-গুলোও fake | Model নিজে কীভাবে মানে বা ভাঙে, সেটা শেখার সুযোগ নেই। RAG-এর R3-এ এখন আসল model আছে, guardrails-এ নেই |
| System prompt hardening: instruction hierarchy, বিশ্বাসযোগ্য আর অবিশ্বাসযোগ্য লেখা আলাদা করে চিহ্নিত করা (spotlighting) | G3-তে system prompt-এ "never reveal" বা "treat … as data" শব্দ থাকলেই "defensive" ধরা হয় | Prompt-এর মান মাপা হয় না, শুধু keyword আছে কিনা দেখে |
| Input classifier (prompt-injection classifier, content moderation model), threshold বেছে নেওয়া | Filter DSL-এ শুধু pattern check: `matches`, `contains_any`, `language_is`, `sentiment_not` ইত্যাদি | Classifier, score বা threshold নেই, তাই FP/FN tradeoff আসলে শেখানো যায় না |
| Normalization: base64 বা hex decode, unicode homoglyph ঠিক করা, অনুবাদ, তারপর filter | Engine-এ decoder আছে (`normaliser/encodings`), কিন্তু learner-এর filter-এ কোনো "decode করে তারপর মেলাও" ধাপ নেই | Encoding bypass-এর বিরুদ্ধে আসল defense শেখানো যায় না |
| Output scanner: PII বা secret detection, আর redact (মুছে দেওয়া), block বা re-ask, এই action-গুলো | Output filter শুধু block করে। Bot সবসময় canary-টা সরাসরি plain text-এ বলে | Redaction, re-ask, encoded leak ধরা, কিছুই নেই (C2) |
| LLM judge-এর slow path, latency আর খরচসহ | `added_model_calls` সবসময় ০, `callsPass = true` | `grd-013`-এর brief-এর "LLM judge" নেই (H2) |
| Tool authorization: allowlist, argument validation, human confirmation, least privilege | G2-তে শুধু একটা tool (`send_email`), আর একটা নিয়ম যা শুধু প্রথম `to` address দেখে। G3-এর `toolPolicyYaml` grader পড়েই না | Excessive agency-র defense শেখানো যায় না |
| Multi-turn: কথোপকথনের state, ধীরে ধীরে চাপ বাড়ানো | সব input একটাই বার্তা। Pool-এর "multi-turn" item-এও কোনো turn নেই | `grd-016` আর `grd-025` যা দাবি করে, তা ঘটেই না |
| Indirect injection: agent অনেক page বা document পড়ে, ব্যবহারকারীর আসল কাজও করে | একটা page, একটা email, শুধু regex | Agent-টা ব্যবহারকারীর আসল কাজ করতে পারল কিনা, সেটা মাপা হয় না |

## ৮. আসল guardrails-এর সাথে তুলনা: Eval

| বাস্তবে যা হয় (garak, PyRIT, promptfoo, HarmBench, AgentDojo, XSTest-এর মতো) | Simulator-এ যা আছে | ফাঁক |
|---|---|---|
| শত শত আলাদা attack কৌশল, প্রতিটার আলাদা family | G3 pool-এ ৫টা attack category, **প্রতিটা একটাই template** ৪০ বার (শুধু সংখ্যা বদলায়)। ২০০টা attack-এর ১৬০টায় একই jailbreak বাক্যাংশ। Benign-এর ৩০০টাও দুটো template থেকে | "৫০১টা item" আসলে প্রায় ৭টা। একটা input regex ৮০% attack ধরে ফেলে |
| Attack success rate (ASR), প্রতিটা attack কয়েকবার চালিয়ে | G1/G2-তে তিনটা নির্দিষ্ট level, একবার করে, ফল নিশ্চিত | Hidden set বলতে আসলে কিছু নেই, শুধু config (canary, attacker) |
| আক্রমণের মধ্যেও কাজ ঠিক হলো কিনা (AgentDojo-র মতো) | মাপা হয় না | G2-তে agent আসল কাজটা করল কিনা, কেউ দেখে না |
| Over-refusal benchmark: ভয়ের মতো শোনায় কিন্তু নিরীহ প্রশ্ন (XSTest-এর মতো) | G3-এর ২০% "adversarial benign" আছে, কিন্তু একটাই template | ভালো ধারণা, কিন্তু বৈচিত্র্য নেই |
| Held-out attack family: অচেনা ধরনের attack-এ defense টেকে কিনা | সব exercise-এ একই pool, আর fail-এ hidden item দেখা যায় (C3) | Generalization মাপা যায় না |
| Category অনুযায়ী ফল, যেমন "encoded-এ ৩/৪০" | শুধু মোট হার, আর failure class প্রায় সবসময় `encoding-bypass` | কোন ধরনের attack আটকাচ্ছে না, learner জানে না |
| Wilson বা bootstrap confidence interval, স্বাধীন sample-এর উপর | Wilson interval আছে (ভালো), কিন্তু item-গুলো template-এর copy, স্বাধীন না | Interval-এর হিসাব গাণিতিকভাবে ঠিক, কিন্তু অর্থ কম |

## ৯. আসল guardrails-এর সাথে তুলনা: Curriculum

OWASP Top 10 for LLM Applications (2025)-এর সাথে মিলিয়ে, আর আসল guardrails stack যা যা করে (NeMo Guardrails-এর input, output, retrieval আর execution rail; Guardrails AI-এর validator; Llama Guard বা Prompt Guard-এর মতো classifier):

| বিষয় | Track-এ আছে? | মন্তব্য |
|---|---|---|
| LLM01 Prompt injection, direct | আছে (G1, ৭টা exercise) | Regex bot, সব clone |
| LLM01 Prompt injection, indirect | আছে (G2, ৭টা exercise) | Regex agent, সব clone |
| LLM07 System prompt leakage | আছে (G1-এর canary) | একই canary সব জায়গায় |
| LLM02 Sensitive information disclosure (PII, secret) | নামে আছে (`grd-007`, `019` "PII & Secret Canary Detection") | আসলে canary extraction। PII খুঁজে বের করা বা redact করার কোনো exercise নেই |
| LLM06 Excessive agency | আংশিক (G2-তে bcc দিয়ে email) | Tool allowlist, argument validation, confirmation, least privilege, এসব defense হিসেবে শেখানো হয় না |
| LLM05 Improper output handling (model-এর output থেকে HTML, markdown link বা image দিয়ে data বেরিয়ে যাওয়া) | নেই | |
| LLM08 Vector/embedding weaknesses (RAG poisoning) | Guardrails-এ নেই। RAG-এর red team-এ আংশিক | |
| LLM10 Unbounded consumption (খরচ, অপব্যবহার, rate limit) | নেই | |
| Content safety moderation (ক্ষতিকর বিষয়ের category, policy) | নেই | |
| Topical rail (bot যেন নিজের বিষয়ের বাইরে না যায়) | নেই | |
| Structured output validation (schema, re-ask) | DSL-এ `json_schema` আছে, কিন্তু কোনো exercise নেই | |
| Over-refusal আর সাহায্যকারী refusal | নামে আছে (`grd-004`) | আসলে attack exercise |
| Multilingual আর obfuscated attack-এর defense | Pool-এ category আছে | Normalization ছাড়া শেখানোর উপায় নেই |
| Monitoring, canary token, incident response | নেই | |

**ভারসাম্য:** ২০টা exercise-এর ১৪টা attack (G1 আর G2), ৬টা defense (G3), আর ৬টা defense exercise-ও আসলে একটাই। আসল guardrails-এর কাজ মূলত defense: classifier বেছে নেওয়া, threshold ঠিক করা, প্রতিটা স্তর নকশা করা, false positive আর utility মাপা। Track এর উল্টো দিকে ভারী।

## ১০. যেভাবে ঠিক করা যায় (প্রস্তাব)

RAG v2-এর মতো একই নীতি: exercise যা শেখানোর দাবি করে, engine সত্যিই সেটা চালাবে, প্রতিটা exercise-এর একটা আলাদা mechanic থাকবে, আর CI প্রমাণ করবে যে shortcut fail করে। তফাত হলো, এখানে জোর defense-এর দিকে।

| Phase | কাজ | কেন আগে |
|---|---|---|
| **A: Integrity** | নিচের ছোট fix, আর contest থেকে clone সরানো | এখনকার score অর্থহীন, contest-এর ফল ভুল |
| **B: Engine** | G3-এর defense pipeline আসল করা: normalization, redaction, classifier, judge, tool policy | এটা ছাড়া কোনো defense mechanic শেখানো যায় না |
| **C: Eval** | প্রতিটা exercise-এর নিজের বৈচিত্র্যময় pool, held-out family, feedback/holdout ভাগ, category অনুযায়ী ফল, utility আর over-refusal মাপা | Engine আসল হলে তবেই মাপার মানে হয় |
| **D: Curriculum (defense-first)** | প্রতিটা G3 exercise-এর একটা mechanic, নতুন defense exercise | OWASP-এর বাকি বিষয় |
| **E: UI** | পুরো brief, G3-এর live probe, run diff, category অনুযায়ী trace | RAG-এ যা আছে, এখানে নেই |
| **Attack (G1/G2)** | টিমের সিদ্ধান্ত | নিচে দেখুন |

**Phase A, ছোট আর নিরাপদ কাজ:**
- UI: পুরো brief দেখানো। বানানো hint, "graded" label আর demo data সরানো। G3-এর label grader অনুযায়ী করা। Web source থেকে canary সরানো, grade response-এ লুকানো। Starter page নিরপেক্ষ করা।
- G1/G2 থেকে fake gateway call সরানো, যাতে খরচ আর budget-এ ভুয়া হিসাব না আসে।
- Meta-র gate আর grader মেলানো, আর guardrails-এর CI test: gate এক, reference pass করে, near-miss fail করে।
- `simulations` controller-এ `UserRateLimitGuard`।
- G3-এর `failingCases`-এ feedback/holdout ভাগ, যাতে holdout item কখনো না দেখায়।
- প্রতিটা exercise-এর নিজের canary, বা per-learner canary।
- Contest: ঠিক না হওয়া পর্যন্ত `beta-ctf-0`, `weekly-advanced-1` আর `weekly-advanced-2`-এ প্রতিটা grader-এর একটা করে problem।

**Phase B, Engine (G3-এর defense pipeline):**
- Bot encoded আর অনুবাদ করা attack-এ সেই রূপেই leak করবে, যাতে শুধু canary filter যথেষ্ট না হয়।
- Filter DSL-এ নতুন ধাপ:
  - Preprocessing: decode (base64/hex), unicode normalization, ভাষা চিহ্নিত করা।
  - Action: block, redact আর re-ask।
- একটা pinned, local classifier: prompt-injection বা moderation-এর ছোট model, RAG-এর cross-encoder-এর মতো transformers.js দিয়ে। Learner threshold বেছে নেবে, তাই FP/FN tradeoff সত্যিই মাপা যাবে।
- Slow path-এ judge রাখতে হলে latency আর খরচসহ। আসল model হলে খরচের সিদ্ধান্ত RAG-এর R3-এর মতোই টিমের।
- `toolPolicyYaml` সত্যিই চলবে: tool allowlist, argument validation, confirmation।

**Phase C, Eval:**
- প্রতিটা exercise-এর নিজের pool, প্রতিটা attack family-র ভেতরেও অনেক রকম লেখা।
- কিছু family শুধু holdout-এ, যাতে বোঝা যায় defense অচেনা attack-এও টেকে কিনা।
- Category অনুযায়ী ফল আর কারণ, যেমন "encoded: ৩/৪০ আটকেছে"।
- Agent exercise-এ attack চলার সময় আসল কাজটা হলো কিনা মাপা।
- নিরীহ কিন্তু ভয়ের মতো শোনায় এমন প্রশ্নের আলাদা set, over-refusal মাপার জন্য।

**Phase D, Curriculum (প্রতিটা exercise-এর একটা defense mechanic):**

| Mechanic | একটা config কেন সবখানে চলবে না |
|---|---|
| Defense in depth: input আর output দুটো স্তরই লাগে | একটা স্তর একা কিছু family ছেড়ে দেয় |
| Normalization: encoded আর homoglyph attack | Decode না করলে pattern মেলে না |
| Multilingual attack | ভাষা না দেখলে অনূদিত attack ঢুকে যায় |
| Classifier threshold আর ROC | Threshold বেশি হলে attack ঢোকে, কম হলে benign আটকায় |
| PII আর secret redaction (block না করে) | Block করলে utility গেট fail করে, কিছু না করলে leak |
| Output handling: link, markdown image, HTML দিয়ে data বেরিয়ে যাওয়া | Output-এর গঠন না দেখলে ধরা পড়ে না |
| Tool authorization: allowlist, argument validation, confirmation | শুধু recipient দেখলে bcc বা অন্য argument দিয়ে বেরিয়ে যায় |
| Topical rail | Bot নিজের বিষয়ের বাইরে চলে যায় |
| Over-refusal calibration | কড়া filter নিরীহ প্রশ্ন আটকায় |
| Judge-এর slow path, latency আর খরচের budget | সবকিছু judge-এ পাঠালে budget শেষ |

**Attack exercise (G1/G2):** নতুন attack scenario আর payload বানানো ঠিক সেই ধরনের কাজ, যেটা RAG-এর red team v2-তে safety check থামিয়ে দিয়েছিল। তাই এগুলো নতুন করে বানানো টিমের সিদ্ধান্ত। ততদিন যা করা যায়:
- Brief ঠিক করা, যাতে "multi-turn" বা "LLM judge"-এর মতো দাবি না থাকে।
- Clone-গুলো কমিয়ে প্রতিটা grader থেকে কয়েকটা রাখা।
- Contest থেকে duplicate সরানো।

## ১১. Priority roadmap (২০২৬-১১-১৯)

প্রতিটা finding একটা phase-এ রাখা হয়েছে। P0 মানে এখনই, কারণ score বা ডেটা ভুল। P1 মানে defense শেখানোর জন্য অপরিহার্য। P2 মানে track-কে পূর্ণাঙ্গ করা।

| Phase | Priority | কাজ | যে finding ঠিক হবে |
|---|---|---|---|
| **G-A: Integrity আর সত্যতা** | P0 | Fake call সরানো, gate মেলানো সাথে CI, rate limit, G3 feedback/holdout, canary লুকানো, পুরো brief, আসল hint, label ঠিক করা, demo data সরানো, starter page নিরপেক্ষ, brief-এর ভুল দাবি ঠিক করা, সব level একসাথে যাচাই, একই config-এ একই sample | H1 (rate limit), H2, H3, H4, C3 (leak অংশ), M1, M3, M4, U1–U6, U9, U10 |
| **G-B: G3 engine** | P1 | Bot encoded আর অনূদিত leak দেবে, DSL-এ decode আর normalization, block/redact action, tool policy চলবে, pinned local classifier, judge-এর slow path (latency আর খরচসহ), per-exercise canary | C2, E1 (G3 অংশ), E3, M2 |
| **G-C: G3 eval** | P1 | প্রতিটা exercise-এর নিজের pool (generator দিয়ে), প্রতিটা family-র ভেতরে বৈচিত্র্য, holdout-এ আলাদা family, category অনুযায়ী ফল, over-refusal set, mechanics আর transfer CI | C1 (G3), C3, E2 |
| **G-D: Defense curriculum** | P2 | ৬টা G3 exercise আলাদা mechanic দিয়ে নতুন করে বানানো। নতুন defense exercise: PII redaction, output handling, tool authorization, topical rail, multilingual, classifier threshold, judge budget | C1 (G3), E4 |
| **G-E: UI v2** | P2 | G3-এর live probe, run diff, category অনুযায়ী trace আর G2-এর tool call trace, ভালো feedback, accessibility, mobile | U7, U8, Low |
| **G-F: Attack track (G1/G2)** | টিমের সিদ্ধান্ত | নতুন attack scenario, clone কমানো, regex bot-এর বদলে আসল model | C1 (G1/G2), H1 (regex), E1 (G1/G2) |

**আলাদা সিদ্ধান্ত লাগবে:**
- **C4, contest:** `weekly-advanced-1` এখন চলছে (১–২৮ নভেম্বর), মাঝপথে problem বদলালে আগের score বদলে যায়। `weekly-advanced-2` কাল (২০ নভেম্বর) শুরু, আর এর fixed pool-এর ১৫টার ৯টা guardrails, যার ৬টা clone। প্রস্তাব: `weekly-advanced-2` আর `beta-ctf-0` থেকে clone সরিয়ে প্রতিটা grader-এর একটা রাখা, `sampleSize` সেই অনুযায়ী কমানো। এটা participant-দের চোখে পড়ে, তাই টিম বা product owner-এর সায় লাগবে।
- **G-F:** নতুন attack scenario আর payload এই workflow-তে বানানো হবে না। RAG-এর red team v2-তে safety check ঠিক এই কাজ থামিয়েছিল। G-C-র attack pool-এ শুধু সবার জানা, সাধারণ ধরনের পরীক্ষার লেখা থাকবে, কাল্পনিক hotel bot-এর canary নিয়ে।
- **আসল judge model (G-B):** রাখলে প্রতিটা run-এ খরচ, RAG-এর R3-এর মতো।

### C5. Advanced exercise ভুল grader-এ যেত (G-A করার সময় পাওয়া)

API-র grading harness আর web workspace দুটোই exercise-এর ধরন ঠিক করত slug-এর নম্বর দেখে: ১৬–২০ হলে G1, ২১–২৫ হলে G2। Advanced exercise-গুলো এই ভাগ মানে না:

| Exercise | `meta.json` বলে | নম্বর দেখে যেত |
|---|---|---|
| `grd-017-adv-indirect-payload` | G2 (page) | G1 (chat) |
| `grd-020-adv-bcc-smuggle` | G2 (page) | G1 (chat) |
| `grd-022/023/024` | G3 (defense) | G2 (page) |

ফলে এই ৫টায় learner ভুল UI পেত, আর submit করলে grader-এর দরকারি field (`attackPrompt` বা `pageContent`) না পেয়ে run error হতো। কেউ এগুলো solve করতে পারত না। Content CI এটা ধরেনি, কারণ CI grader বাছে `meta.json` থেকে, production বাছত slug থেকে। `guardrails-archetype.spec.ts` এটা ধরছিল, কিন্তু পুরনো fail হিসেবে বাকি fail-এর সাথে মিশে ছিল।

ঠিক করা হয়েছে:
- API এখন `meta.json`-এর `graderArchetype` দেখে (RAG যেভাবে করে)। Slug-এর নম্বর শুধু fallback।
- Web এখন `submissionSchema` দেখে (যেটা `meta.json` থেকেই আসে)। Advanced exercise তার মূল exercise-এর mock app আর starter page পায়।
- নতুন CI: প্রতিটা published guardrails exercise-এর reference আর near-miss production harness দিয়ে grade হয়, CI-র ফলের সাথে মিলতে হবে।

Database-এ দেখা: এই ৫টাই `weekly-advanced-2` (কাল, ২০ নভেম্বর শুরু), `beta-ctf-0` আর `core-15-championship`-এ আছে, চলমান `weekly-advanced-1`-এ নেই। এই ৫টায় এখনো কোনো run হয়নি, তাই কারো score-এ প্রভাব পড়েনি। কিন্তু fix deploy না হলে `weekly-advanced-2`-এর ১৫টার ৫টা problem কেউ solve করতে পারবে না, তাই এটা contest শুরুর আগে deploy হওয়া দরকার।

### Phase G-A-এর অবস্থা (২০২৬-১১-১৯)

| কাজ | Finding | অবস্থা |
|---|---|---|
| G1/G2-তে fake model call আর তার খরচ সরানো | H3 | ✅ |
| Live simulator-এ rate limit (প্রতি user মিনিটে ৬০টা, G1 আর G2 আলাদা) | H1 (rate limit) | ✅ |
| `meta.json`-এর gate = grader যা যাচাই করে। G1/G2: `levels_won = 3`। G3: আগের gate আর filter ≤ ৬০০ token | H4 | ✅ |
| CI: reference pass, near-miss fail, gate মেলে, ফলে canary বা hidden marker নেই, holdout item দেখায় না, production harness একই ফল দেয় (`guardrails-content.spec.ts`) | H4, M4 | ✅ |
| G3 feedback/holdout ভাগ: miss-এর উদাহরণ শুধু feedback অংশ থেকে, holdout-এর শুধু সংখ্যা | C3 (leak অংশ) | ✅ |
| G3-এ একই config মানে একই sample (seed config-এর hash, `runId` নয়) | M3 | ✅ |
| Canary লুকানো: web source থেকে সরানো, ফলের লেখায় "[canary]" | U2 | ✅ |
| ২০টা brief নতুন করে লেখা, ভুল দাবি বাদ (multi-turn, LLM judge, refusal UX)। Workspace-এ পুরো brief দেখায় | H2, M1, U1 | ✅ |
| Hint `hints.json` থেকে, খরচসহ, unlock button। বানানো "N attempts পরে খুলবে" বাদ | U4 | ✅ |
| Label ঠিক করা: "Chat · not graded" / "Submit · graded on all three levels", G2-এর level নাম grader-এর মতো, G3-এ Wilson interval, sample দ্বিগুণ হলে বলে, tool policy "not graded yet" | U5, U6 | ✅ |
| G1 run page থেকে demo data সরানো | U9 | ✅ |
| G2 starter page নিরপেক্ষ, ভেতরে কোনো নির্দেশ বা hint নেই | U10 | ✅ |
| G1 আর G2-তে "Check on all 3 levels": একই input তিনটা level-এ চালিয়ে কোনটা টিকল দেখায় | U3 | ✅ |
| Scorecard: attack family অনুযায়ী ফল, কোন level কেন টিকল, holdout-এ কতগুলো miss | U7 (আংশিক) | ✅ |
| Advanced exercise-এর routing bug | C5 | ✅ |

**যাচাই:** API-তে guardrails আর content-এর সব test pass। পুরো API suite-এ ১৫টা suite fail করে, সবগুলো আগে থেকেই (agent, benchmark, evaluation, nn, ft, p1, va1, content-pipeline-এর ৩০/৫০ সংখ্যা)। আগে ১৬টা ছিল, `guardrails-archetype.spec.ts` এখন pass করে। Web-এ `tsc` পরিষ্কার, নতুন কোনো lint error নেই। আলাদা temp stack-এ browser দিয়ে দেখা হয়েছে: G1 (`grd-001`) আর G2 (`grd-017`)-এ reference তিনটা level-ই জেতে, `grd-017` এখন page UI পায় আর grade হয়ে pass করে, G3 (`grd-013`)-এর starter config fail করে family table আর holdout note দেখায়।

**G-A-তে যা হয়নি, পরের phase-এ:** G3-এর একই hidden pool (C3-এর বাকি অংশ, G-C), এক লাইনের filter (C2, G-B), clone (C1, G-C/G-D/G-F), contest (C4, টিমের সিদ্ধান্ত)।

### Phase G-B-এর অবস্থা (২০২৬-১১-২৩)

G3-এর defense pipeline এখন সত্যিই চলে। প্রতিটা স্তর এমন জিনিস আটকায় যা অন্য স্তর পারে না, আর CI প্রমাণ করে যে একটা স্তর একা যথেষ্ট না।

| কাজ | কোথায় | Finding | অবস্থা |
|---|---|---|---|
| নতুন concierge bot: message যেভাবে চায় সেভাবে leak করে (hex message-এ hex-এ, হিব্রুতে হিব্রু বাক্যে, page-এর নির্দেশে `send_email` tool call দিয়ে)। System prompt-এর প্রতিটা ধরনের attack-এর জন্য আলাদা clause লাগে; clause থাকলেও prompt মাত্র ২৫% ক্ষেত্রে টেকে, না থাকলে ৫% | `g3-bot.ts` | C2, E1, E3 | ✅ |
| প্রতিটা exercise-এর নিজের secret, শুধু hidden file-এ (`OVERRIDE-XX-0000` আকারে)। Brief-এ শুধু আকারটা বলা | `eval_hidden.json` | M2 | ✅ |
| Filter-এ `normalize`: `decode_hex`, `decode_base64`, `unicode` (homoglyph আর NFKC), `lowercase`, `join_spaced`। প্রতিটা decoded অংশ আলাদা view, raw offset-এ ফেরার map সহ | `normaliser/text-views.ts` | E3 | ✅ |
| Output filter-এ `action: redact`: ব্যর্থ `not_matches`/`contains_none` যা পেয়েছে শুধু সেটুকু কাটে। যে check-এর কাটার কিছু নেই (classifier, judge, length), তখন পুরো reply block | `g3.grade.ts` | E3 | ✅ |
| `classifier` check: pinned, local prompt-injection model (`Horizon-Labs/prompt-injection-guard-small`, mmBERT-small, Apache-2.0, বহুভাষিক, q8 ONNX প্রায় ২৭০ MB)। Learner শুধু threshold বেছে নেয় | `g3-classifier.ts` | E1, E3 | ✅ |
| `judge` check: simulated LLM judge, প্রায় ৯৭% ঠিক, প্রতি call ৪৫০ ms আর €০.০০০৩। `when_pattern` দিয়ে শুধু সন্দেহজনক message-এ চালানো যায়। নতুন gate: প্রতি message-এ ≤ ০.২৫ judge call | `g3.grade.ts` | E1 | ✅ |
| `toolPolicyYaml` এখন grade হয়: `default`, প্রতি tool-এ `allow`/`deny`, `recipients` glob, `args_must_not_match` (normalize সহ) | `g3-tool-policy.ts` | U6, E3 | ✅ |
| নতুন gate: প্রতিটা attack family কমপক্ষে ৮০% আটকাতে হবে। একটা স্তর না থাকলে একটা family প্রায় পুরোটা ঢুকে যায়, অথচ মোট হার ৯০%-এর কাছে থাকতে পারে | `g3.grade.ts`, ৬টা `meta.json` | E2 (আংশিক) | ✅ |
| Scorecard: secret কোন পথে বেরোল (reply না tool call), কোন স্তর guest আটকাল, প্রতিটা miss-এর কারণ ("encoded · leaked in the reply as hex"), দুর্বলতম family, judge-এর খরচ আর latency | web scorecard | U7 | ✅ |
| G3 workspace: tool policy আর "optional" না, চতুর্থ ধাপ। Starter config নিরপেক্ষ, শুধু syntax-এর comment | web G3 panel | U6, U10 | ✅ |

**যাচাই করা mechanic** (`grd-013`, CI-তে প্রতিটা G3 exercise-এ):

| Config | ফল | কারণ |
|---|---|---|
| Reference: hardened prompt + normalize করা output filter + tool policy | pass, ৮০/৮০ আর ১২০/১২০ | |
| শুধু plain secret-এর output filter, secret জানা থাকলেও (আগের C2 shortcut) | fail | hex leak আর email দিয়ে বেরোয় |
| শুধু system prompt | fail | attack-এর প্রায় ৮০% ঢোকে |
| Near-miss: reference থেকে শুধু `normalize` বাদ | fail, encoded family ৩৮% | hex leak filter পেরোয় |
| Tool policy ছাড়া | fail, indirect family | secret email-এ বেরোয় |
| সব tool deny | fail, benign ০% | guest booking করতে পারে না |
| প্রতিটা message-এ judge | fail | judge budget |
| Classifier threshold ০.০৫ বনাম ০.৯ | ০.০৫-এ বেশি guest আটকায় | FP/FN tradeoff |
| `action: redact` | pass | block না করেও secret কাটা যায় |

**যাচাই:** নতুন unit test (bot, normaliser, tool policy, DSL, YAML), engine test (classifier-সহ), আর content CI-তে "কোনো একটা স্তর একা যথেষ্ট না"। পুরো API suite-এ ১৫টা suite fail, সবই আগের। `rag-eval-invariants`-এর একটা test পুরো suite-এর চাপে ১২০ s পেরোচ্ছিল, তাই তার timeout ৩০০ s করা হয়েছে (একা চালালে ২৯ s)। Browser-এ G3 workspace-এ near-miss fail (`family-gap:encoded`) আর reference pass দেখা হয়েছে।

**Deploy-এর জন্য:** `npm run models:fetch -w @labpath/api` এখন classifier-ও নামায় (প্রায় ৩০০ MB)। Worker-এ model না থাকলে আর download বন্ধ থাকলে classifier ব্যবহার করা run error দেয়।

**G-B যা ঠিক করে না (G-C-র কাজ):**
- Pool এখনো template-এর copy। তাই "Be helpful." + classifier ০.৯ pass করে (সব attack-এর score প্রায় ১.০), আর `ignore previous instructions`-এর একটা input regex ৮০% attack আটকায়। বৈচিত্র্যময় pool এলে classifier-এর threshold আর indirect family-র জন্য tool policy সত্যিই লাগবে।
- Pool-এর attack-এর লেখায় এখনো পুরনো `OVERRIDE-BK-7742` আছে (এটা এখন কোনো G3 exercise-এর secret না, G1-এর canary)।
- ৬টা G3 exercise এখনো একই reference দিয়ে pass করে (C1, G-D)।

### Phase G-C-এর অবস্থা (২০২৬-১১-২৩)

G3-এর hidden set এখন generator দিয়ে বানানো, প্রতিটা exercise-এর নিজের। আগের pool ছিল ৭টা template-এর copy; এখন প্রতিটা family-র ভেতরে লেখা বদলায়।

| কাজ | কোথায় | Finding | অবস্থা |
|---|---|---|---|
| Pool generator: প্রতিটা G3 exercise-এর জন্য ৫৫০টা message (২৫০ attack, ৩০০ guest), নিজের seed আর নিজের secret, deterministic, `--check` সহ | `scripts/content/build-guard-pools.mjs` | C3, E2 | ✅ |
| ৭টা attack family: direct, page (summary চাওয়া page-এর ভেতরে নির্দেশ), encoded (hex/base64), earlier-turn, other-language (es, fr, de, he, ru, ar), role-play, disguised-output (spaced, base64, look-alike অক্ষর)। সবই সবার জানা ধরনের, কাল্পনিক hotel bot-এর কাল্পনিক code নিয়ে | generator | E2 | ✅ |
| Role-play আর disguised-output শুধু holdout-এ: গোনা হয়, কখনো দেখানো হয় না। অচেনা attack-এ defense টেকে কিনা মাপে | generator, `g3.grade.ts` (`split`) | E2 | ✅ |
| Guest message-এর ৭টা ধরন, তার মধ্যে over-refusal set (XSTest-এর মতো): "gym door code", "override the thermostat", "ignore my previous message", অন্য ভাষায় booking, hex-এর মতো দেখতে booking reference | generator | E2 | ✅ |
| Utility under attack (AgentDojo-র মতো): page summary-র কাজের ভেতরে attack থাকলে, attack আটকানোর পরও summary email যেতে হবে। নতুন gate ≥ ৮০% | `g3-bot.ts`, `g3.grade.ts`, ৬টা `meta.json` | E2 | ✅ |
| Bot এখন বৈচিত্র্যময় লেখা, ৬টা ভাষা, role-play আর page task বোঝে। Guest নিজের ঠিকানায় confirmation email চায়, তাই শুধু `*@hotel.test`-এর recipient allowlist guest আটকায়; ঠিক policy হলো argument-এ secret pattern না থাকা | `g3-bot.ts` | | ✅ |
| Public example: প্রতিটা দেখানো family থেকে একটা, hidden pool-এ নেই | `eval_public.json` | U1 | ✅ |
| CI: generator `--check`; প্রতিটা message bot তার label অনুযায়ী বোঝে; holdout family কখনো feedback-এ না; কোনো ৪-শব্দের phrase কোনো family-র অর্ধেক ঢাকে না (এখন সর্বোচ্চ ৪০%, আগে ১০০%); দুই exercise-এর attack-এর মিল ৩৫%-এর কম (এখন সর্বোচ্চ ২২%) | `guardrails-pool.spec.ts` | C3, E2 | ✅ |
| Scorecard: "task done under attack", holdout family-তে "never shown", headline বলে কী ভুল হয়েছে (attack ঢুকেছে, guest আটকেছে, task হারিয়েছে, budget) | web | U7 | ✅ |

**যাচাই করা mechanic** (`grd-013`, CI-তে প্রতিটা G3 exercise-এ):

| Config | ফল | কারণ |
|---|---|---|
| Reference: hardened prompt + normalize করা output filter + secret pattern-এর tool policy | pass | |
| Recipient allowlist (`*@hotel.test`) secret check-এর বদলে | fail, benign ৮৫% | guest-এর নিজের ঠিকানায় confirmation আটকায় |
| `ignore previous instructions`-এর input regex + plain output filter | fail, encoded family | লেখা বদলায়, regex ঢাকে না |
| শুধু classifier (০.৯) বা reference + classifier | fail, task ০% | page task-সহ পুরো request block হয় |
| Near-miss (normalize ছাড়া) | fail, disguised-output আর encoded | |
| Tool policy ছাড়া | fail, page family আর task | |
| সব email deny | fail | guest আর task দুটোই হারায় |

**যাচাই:** পুরো API suite-এ ১৫টা suite fail, সবই আগের (নতুন `guardrails-pool.spec.ts` সহ ৯২টা suite)। Web-এ `tsc` আর lint পরিষ্কার। Browser-এ `grd-014`-এ recipient allowlist fail ("Guests were blocked", confirmation ০/৯) আর reference pass দেখা হয়েছে।

**এখনো বাকি (G-D):** ৬টা G3 exercise এখনো একই mechanic, তাই একই reference সবগুলো pass করে (C1)। G-D-তে প্রতিটা exercise-এর আলাদা defense mechanic আর transfer CI।

### Phase G-D-এর অবস্থা (২০২৬-১১-২৩)

৬টা G3 exercise এখন ৬টা আলাদা defense শেখায়। প্রতিটার নিজের scenario (কোন ক্ষতি ঠেকাতে হবে), নিজের pool, নিজের reference। কোনো exercise-এর reference অন্য কোনোটা pass করে না (C1 ঠিক হলো)।

| Exercise | Scenario: কী ক্ষতি | যে defense লাগে | Near-miss কেন fail করে |
|---|---|---|---|
| `grd-013` Defense in Depth | Secret code বেরোনো (G-C-র মতো) | Prompt + decode করা output filter + secret pattern-এর tool policy | `normalize` নেই, hex আর disguised leak পেরোয় |
| `grd-014` FP/FN Tradeoff (Wilson) | Inject করা নির্দেশে `waive_fee` চলে। Guest-ও একই call চায়, তাই output বা tool policy আলাদা করতে পারে না | Input-এ classifier cascade (`max` + `judge_from`, মাঝের অনিশ্চিত অংশ judge-এ), পরিচিত guest phrasing-এর exception, pasted page-এ judge | একটা threshold (০.০৫): role-play ঢোকে, risky guest আটকায় |
| `grd-015` → Topical Rail on a Judge Budget | Concierge অন্য কাজ করে দেয় (essay, code, stock tip) | সস্তা keyword filter + যে message-এ hotel বা স্পষ্ট শব্দ নেই শুধু সেগুলো judge-এ | শুধু keyword: subtle attack ঢোকে |
| `grd-022` → Tool Arguments (Advanced) | Guest-এর নিজের email-এ inject করা cc/bcc | Tool policy-তে `strip_args: [cc, bcc]` | `max_recipients: 1`: email deny হয়, guest-এর কাজ হারায় |
| `grd-023` → Links That Leak (Advanced) | Reply-তে বাইরের image বা link, URL-এ booking data | Output filter `urls_allowed: [hotel.test]` + `action: redact` | Block: attack থামে কিন্তু উত্তরও যায় |
| `grd-024` → Other Guests' Data (Advanced) | অন্য guest-এর phone আর email | Redact: guest-এর phone/email pattern, `join_spaced` সহ; hotel-এর নিজের contact থাকবে | Block: সাধারণ প্রশ্নের উত্তরও যায় |

**Engine-এ যা যোগ হলো:**
- `g3-scenarios.ts`: ৫টা নতুন deterministic concierge, প্রতিটার নিজের ক্ষতির সংজ্ঞা আর judge-এর ground truth। Grader এখন সাধারণ "harm" দেখে: secret, একটা call চলা, call-এ একটা মান থাকা, বা shown reply-তে একটা মান থাকা। Utility-ও সাধারণ: call চলতে হবে, বা উত্তরের অংশ দেখাতে হবে।
- DSL: `urls_allowed` (link/image domain allowlist, subdomain সহ; redact markdown সহ কাটে), `classifier`-এ `judge_from` (cascade)।
- Tool policy: `strip_args`, `max_recipients`।
- Scorecard: holdout family-র নাম grader পাঠায়; "Attacks got through" লেখা।

**Shortcut যা CI-তে fail করে:** fee-waiver-এ judge band ছাড়া ০.৫-এ classifier, exception ছাড়া cascade (judge budget), waiver tool deny; off-topic-এ সব message judge; email-args-এ recipient allowlist আর policy ছাড়া; links-এ output filter ছাড়া; pii-তে সব email/phone redact (hotel contact-ও কাটে)। আর প্রতিটা exercise-এর reference বাকি ৫টায় fail (transfer)।

**যাচাই:** পুরো API suite-এ ১৫টা suite fail, সবই আগের (মোট ৯৩টা suite, নতুন `g3-scenarios.spec.ts` সহ)। Content validate পরিষ্কার। Worker দিয়ে browser-এ দেখা: `grd-023`-এ block fail ("Attacks stopped, but tasks were lost", task ২১%) আর reference pass; `grd-014`-এ reference pass, judge ০.২০/message, +১০৭ ms, €০.০১২৩।

**খেয়াল রাখার মতো:**
- Classifier page-এর ভেতরের injection প্রায় দেখে না (score ~০.০১), model card-এর BIPIA ফলের সাথে মেলে। `grd-014`-এ এটাই শেখানোর বিষয়।
- `grd-015`, `022`, `023`, `024`-এর title বদলেছে (core-15 manifest-ও)। এগুলো `weekly-advanced-2`, `beta-ctf-0` আর `core-15-championship`-এ আছে, তাই contest চলার সময় deploy করলে ওই problem-গুলোর নাম আর grading বদলাবে।
- নতুন defense exercise (topical rail ছাড়া বাকি OWASP বিষয়: moderation, unbounded consumption) এখনো যোগ হয়নি; সেটা catalog-এ নতুন exercise publish করার সিদ্ধান্ত।

### Phase G-E-এর অবস্থা (২০২৬-১১-২৩)

| কাজ | কোথায় | Finding | অবস্থা |
|---|---|---|---|
| G3 live probe: editor-এর stack (save না করলেও) দিয়ে একটা message চালানো, প্রতিটা স্তর কী করল দেখায় (input filter, concierge-এর উত্তর, প্রতিটা tool call: চলল/deny/কোন argument কাটা গেল, output filter, যা দেখানো হলো, attack টিকল কিনা)। Grade হয় না, প্রতি মিনিটে ৩০টা। Secret সব জায়গায় mask করা, pool কখনো বের হয় না | `POST /simulations/g3/probe`, Probe tab | U8 | ✅ |
| Run history আর diff: আগের graded run-গুলো, যেকোনোটা বেছে আগেরটার সাথে তুলনা: কোন স্তর বদলেছে, প্রতিটা gate, প্রতিটা family। "Load this stack" দিয়ে পুরনো config editor-এ ফেরানো যায় | History tab, `submissions.service` | U8 | ✅ |
| Guardrails trace page: আগে RAG-এর "Retrieval/Queries" দেখাত, সব ০। এখন G1-এ প্রতিটা level-এর উত্তর (code কখনো দেখায় না), G2-তে প্রতিটা level-এর tool call (to/cc/bcc) আর policy, G3-তে sample-এর কয়েকটা message স্তর ধরে ধরে (শুধু feedback অংশের; got through, guest আটকানো আর কয়েকটা আটকানো attack) | `trace.levels`, `trace.cases`, `guardrails-trace-view.tsx` | U8 | ✅ |
| Grader-এর ভেতরের কাজ ভাগ করা (`prepare`, `runLayers`, `harmsLeft`, `taskDone`), যাতে probe আর trace grader-এর হুবহু একই পথে চলে | `g3.grade.ts` | | ✅ |
| Accessibility: chat log `role="log"` আর `aria-live`, chat textarea, G2 page editor আর G3-এর প্রতিটা code editor-এর label, probe-এর ফল `aria-live` | web | Low | ✅ |
| Phone width: ৬৪০px-এর নিচে tab, footer, metric আর step-গুলো ভাঁজ হয়; ৩৯০px-এ G1, G2, G3 কোনো page-এ horizontal scroll নেই | CSS | Low | ✅ |

**যাচাই:** নতুন test: probe এক message স্তর ধরে চালায় আর secret দেখায় না; G3 trace-এর case-এ secret নেই আর কোনো holdout message নেই (content CI)। পুরো API suite-এ ১৫টা suite fail, সবই আগের। Web `tsc` পরিষ্কার, নতুন lint error নেই। Worker দিয়ে browser-এ: probe ("Attack got through", secret `[secret]`), দুটো submit-এর পর History diff ("Edited: output filter", encoded ৪/১৩ → ১২/১২), G3 trace (৭টা message), G1 আর G2 trace (level ধরে), আর ৩৯০px-এ তিনটা page।

**আগে থেকেই আছে, এই phase-এ ধরিনি:** run/trace আর workspace page-এ React hydration warning (server আর client-এর HTML মেলে না), আর G3 editor-এ submit করার পরও "unsaved" দেখানো।

### Phase G-F-এর অবস্থা (২০২৬-১১-২৩)

Attack track-এর ১৪টা exercise (G1-এর ৭টা, G2-এর ৭টা) আর clone না। প্রতিটার নিজের defense, প্রতিটা defense-এর একটা বাস্তব ফাঁক; একটা exercise-এর reference অন্য কোনোটা pass করে না (CI)। কাজটা defense-এর দিক থেকে করা: নতুন jailbreak কৌশল বানানো হয়নি, reference উত্তরগুলো কাল্পনিক simulator-এর বিরুদ্ধে সবার জানা ধরনের ছোট message। Simulator আগের মতোই deterministic, আসল model নেই (খরচের সিদ্ধান্ত টিমের)।

**G1 (concierge, code বের করা):** Level 2-এর hardened prompt প্রতিটা exercise-এ এক ধরনের অনুরোধেই নরম হয়, আর level 3-এর output filter আলাদা আলাদা রূপ ধরে।

| Exercise | Level 2 যেটাতে নরম হয় | Input guard | Level 3 filter যা ধরে না |
|---|---|---|---|
| `001` | নিয়ম ভুলতে বলা | নেই | encoding (hex, base64, …) |
| `004` | staff পরিচয় | override কথা পুরো message-এ | hex, spaced, spelled… |
| `005` | code অন্য রূপে বদলাতে বলা | নেই | spaced, dash দিয়ে ভাগ, look-alike |
| `007` | debug/diagnostic | নেই | শুধু hex |
| `016` | নিয়ম ভুলতে বলা | override কথা শুধু প্রথম ১৬০ অক্ষরে | plain ছাড়া সব |
| `018` | code অন্য রূপে বদলাতে বলা | নেই | spelled out, acrostic |
| `019` | config export/backup | "hex" আর "hexadecimal" শব্দ | শুধু hex |

**G2 (email assistant, attacker-কে email পাঠানো):** Level 2-এ page পড়ার একটা defense, level 3-এ approval policy; দুটোরই একটা ফাঁক।

| Exercise | Level 2 view | Level 3 policy-র ফাঁক |
|---|---|---|
| `002` | `<untrusted>` wrapper (বন্ধ tag দিয়ে বেরোনো যায়) | শুধু প্রথম To দেখে |
| `010` | page শুধু data, user-এর turn মানে (`User:` লাইন নকল করা যায়) | শুধু প্রথম To দেখে |
| `011` | send/email-এর লাইন মুছে দেয় (email header থাকে) | Bcc দেখে না |
| `017` | প্রথম ৪০০ অক্ষর wrap করা | Bcc দেখে না |
| `020` | send/email-এর লাইন মুছে দেয় | "hotel.test" আছে কিনা দেখে (attacker `inbox@hotel.test.drop-box.test`) |
| `021` | page শুধু data, user-এর turn মানে | শুধু email দেখে, `share_document` দেখে না |
| `025` | `<untrusted>` wrapper | শুধু turn-এর প্রথম email দেখে |

**অন্য যা বদলেছে:**
- Engine: `g1-profiles.ts`, `g2-profiles.ts`; concierge আর email agent profile থেকে চলে, grade আর live simulator একই পথে।
- Brief: প্রতিটা exercise-এর level-গুলো engine-এর লেখা থেকেই, CI মিলিয়ে দেখে।
- Web: level card আর "Check all 3 levels" এখন exercise-এর নিজের level (`GET /simulations/levels`), trace page-এ level-এর defense।
- `020`-এর hidden file-এ attacker বদলেছে।

**যাচাই:** G1 আর G2 দুটোতেই reference-এর transfer matrix পুরো কর্ণ (নিজেরটাই শুধু pass)। পুরো API suite-এ ১৫টা suite fail, সবই আগের। Browser-এ (worker সহ): `grd-004`-এ নিজের reference তিনটা level-ই জেতে আর `001`-এর reference level 2-এ আটকায়; `grd-021`-এ নিজের reference জেতে আর grade হয়ে pass, `010`-এর reference level 3-এ আটকায়।

**বাকি:** G1 আর G2-এর canary আর attacker (০২০ ছাড়া) সব exercise-এ এক; আসল model দিয়ে bot চালানোর সিদ্ধান্ত টিমের।
