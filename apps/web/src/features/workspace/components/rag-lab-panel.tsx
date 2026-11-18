"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { InfoTip } from "./info-tip";
import { RagTargetConsole } from "./rag-target-console";
import { ragLabApi, ragLabErrorMessage } from "../rag-lab/rag-lab-api";
import {
  CHUNK_ID_TIP,
  LAB_TAB_LABELS,
  labTabsForArchetype,
  SCORE_TIP,
  type LabTab,
} from "../rag-lab/rag-lab-copy";
import type {
  RagLabArchetype,
  RagLabContext,
  RagLabPreview,
} from "../rag-lab/rag-lab-types";
import { formatGateThreshold, gateMetricLabel, gradedGates, type GateSpec } from "../gates";
import "../rag-lab.css";

type RagLabPanelProps = {
  slug: string;
  payload: Record<string, unknown>;
  /** Exercise gates, so the preview can be read against the token budget. */
  gates?: unknown;
};

/** Which graded token metric the lab's per-question token count corresponds to. */
const TOKEN_GATE_BY_ARCHETYPE: Partial<Record<RagLabArchetype, string>> = {
  r1: "mean_context_tokens",
  r2: "mean_prompt_tokens",
  r4: "context_tokens",
  r5: "mean_prompt_tokens",
};

function tokenGateFor(archetype: RagLabArchetype, gates: unknown): GateSpec | null {
  const metric = TOKEN_GATE_BY_ARCHETYPE[archetype];
  if (!metric) {
    return null;
  }
  return gradedGates(gates).find((gate) => gate.metric === metric) ?? null;
}

function withinGate(gate: GateSpec, value: number): boolean {
  switch (gate.op) {
    case "lte":
      return value <= gate.value;
    case "lt":
      return value < gate.value;
    case "gte":
      return value >= gate.value;
    case "gt":
      return value > gate.value;
    default:
      return value === gate.value;
  }
}

export function RagLabPanel({ slug, payload, gates }: RagLabPanelProps) {
  const [context, setContext] = useState<RagLabContext | null>(null);
  const [preview, setPreview] = useState<RagLabPreview | null>(null);
  const [tab, setTab] = useState<LabTab>("query");
  const [questionId, setQuestionId] = useState<string>("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** R3 only: which config + question the shown preview was generated for. */
  const [previewedKey, setPreviewedKey] = useState<string | null>(null);
  const previewRequestRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    ragLabApi
      .getContext(slug)
      .then((result) => {
        if (!cancelled) {
          setContext(result);
          setQuestionId(result.questions[0]?.id ?? "");
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(ragLabErrorMessage(caught, "Could not load the RAG lab for this exercise."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // R5 routes a query through its class profile; custom queries borrow the
  // class of the public question picked in the dropdown.
  const activeClass =
    context?.questions.find((item) => item.id === questionId)?.class ?? null;

  const activeQuestion = useMemo(() => {
    if (customQuestion.trim()) {
      return customQuestion.trim();
    }
    const picked = context?.questions.find((item) => item.id === questionId);
    return picked?.question ?? "";
  }, [context, questionId, customQuestion]);

  // R3 previews call a real model (slow, rate limited, can be down), so they
  // run on request instead of on every config edit.
  const manualPreview = context?.archetype === "r3";
  const previewKey = JSON.stringify([payload, activeQuestion, activeClass]);

  useEffect(() => {
    if (
      !context?.labEnabled ||
      !activeQuestion ||
      context.archetype === "redteam" ||
      context.archetype === "r3"
    ) {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setPreviewing(true);
      ragLabApi
        .preview(slug, payload, activeQuestion, activeClass)
        .then((result) => {
          if (!cancelled) {
            setPreview(result);
            setError(null);
          }
        })
        .catch((caught: unknown) => {
          if (!cancelled) {
            setPreview(null);
            setError(ragLabErrorMessage(caught, "Preview failed — check your config fields."));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setPreviewing(false);
          }
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, payload, activeQuestion, activeClass, context?.labEnabled, context?.archetype]);

  async function generatePreview() {
    if (!activeQuestion || previewing) {
      return;
    }
    const request = ++previewRequestRef.current;
    const key = previewKey;
    setPreviewing(true);
    setError(null);
    try {
      const result = await ragLabApi.preview(slug, payload, activeQuestion, activeClass);
      if (request === previewRequestRef.current) {
        setPreview(result);
        setPreviewedKey(key);
      }
    } catch (caught: unknown) {
      if (request === previewRequestRef.current) {
        setError(ragLabErrorMessage(caught, "Preview failed — check your config fields."));
      }
    } finally {
      if (request === previewRequestRef.current) {
        setPreviewing(false);
      }
    }
  }

  /** R4: run the rewrite prompt once on the live model for this question. */
  async function runRewrite() {
    if (!activeQuestion || previewing) {
      return;
    }
    const request = ++previewRequestRef.current;
    setPreviewing(true);
    setError(null);
    try {
      const result = await ragLabApi.preview(slug, payload, activeQuestion, activeClass, true);
      if (request === previewRequestRef.current) {
        setPreview(result);
      }
    } catch (caught: unknown) {
      if (request === previewRequestRef.current) {
        setError(ragLabErrorMessage(caught, "The rewrite could not run."));
      }
    } finally {
      if (request === previewRequestRef.current) {
        setPreviewing(false);
      }
    }
  }

  const archetype = preview?.archetype ?? context?.archetype ?? "unknown";
  const visibleTabs = useMemo(() => labTabsForArchetype(archetype), [archetype]);
  const showGenerate = visibleTabs.includes("generate");
  const activeTab = visibleTabs.includes(tab) ? tab : (visibleTabs[0] ?? "query");

  if (loading) {
    return (
      <div className="lp-rag-lab lp-rag-lab--loading" aria-busy="true">
        <p>Loading simulation lab…</p>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="lp-rag-lab lp-rag-lab--disabled">
        <p className="lp-rag-lab-error" role="alert">
          {error ?? "Could not load the RAG lab for this exercise."}
        </p>
      </div>
    );
  }

  if (!context.labEnabled) {
    return (
      <div className="lp-rag-lab lp-rag-lab--disabled">
        <p>This sandbox exercise uses the Python editor. Run your retriever code, then submit to grade.</p>
      </div>
    );
  }

  const chunksByDoc = groupChunks(preview?.chunks ?? []);
  const frozen = preview?.frozen ?? context.frozen;
  const tokenGate = tokenGateFor(archetype, gates);
  const isPublicQuestion = !customQuestion.trim();
  const selectedQuestion = isPublicQuestion
    ? context.questions.find((item) => item.id === questionId)
    : undefined;

  return (
    <div className="lp-rag-lab">
      <div className="lp-rag-lab-head">
        <div>
          <h2 className="lp-rag-lab-title">Simulation Lab</h2>
          <p className="lp-rag-lab-lead">
            {archetype === "redteam"
              ? "Talk to the target bot and read its public corpus. Not graded: submit the flag you find from Submission."
              : "Runs your current config on the public corpus and sample questions. Not graded: submit from Submission to score the hidden set."}
          </p>
        </div>
        {frozen ? (
          <div className="lp-rag-lab-frozen" aria-label="Fixed pipeline settings">
            <span className="lp-rag-lab-frozen-label">{frozen.label}</span>
            {frozen.items.map((item) => (
              <span key={item} className="lp-rag-lab-frozen-chip">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="lp-rag-lab-tabs" role="tablist" aria-label="RAG lab views">
        {visibleTabs.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={activeTab === item}
            className={`lp-rag-lab-tab${activeTab === item ? " is-active" : ""}`}
            onClick={() => setTab(item)}
          >
            {LAB_TAB_LABELS[item]}
          </button>
        ))}
        {archetype === "redteam" ? null : manualPreview ? (
          <button
            type="button"
            className="lp-rag-lab-run"
            disabled={previewing || !activeQuestion}
            onClick={() => void generatePreview()}
          >
            {previewing ? "Generating…" : preview ? "Generate again" : "Generate preview"}
          </button>
        ) : (
          <span className={`lp-rag-lab-status${previewing ? " is-busy" : ""}`}>
            {previewing ? "Updating…" : preview ? `${preview.chunkCount} chunks` : "—"}
          </span>
        )}
      </div>

      {error ? (
        <p className="lp-rag-lab-error" role="alert">
          {error}
        </p>
      ) : null}

      {manualPreview && preview && !previewing && previewedKey !== previewKey ? (
        <p className="lp-rag-lab-empty">
          Your config or question changed since this preview. Press Generate again to update it.
        </p>
      ) : null}

      {activeTab === "target" ? (
        <RagTargetConsole slug={slug} botName={context.target?.botName ?? "Target bot"} />
      ) : null}

      {activeTab === "corpus" ? (
        <section className="lp-rag-lab-pane" aria-label="Corpus documents">
          <ul className="lp-rag-lab-corpus">
            {context.corpus.map((doc) => (
              <li key={doc.id} className="lp-rag-lab-doc">
                <div className="lp-rag-lab-doc-head">
                  <strong>{doc.title}</strong>
                  <span>
                    {doc.id} · {doc.text.length} chars
                  </span>
                </div>
                {doc.meta ? (
                  <p className="lp-rag-lab-doc-meta" aria-label="Document metadata">
                    {doc.meta.status ? (
                      <span className={`lp-rag-lab-doc-status is-${doc.meta.status}`}>
                        {doc.meta.status}
                      </span>
                    ) : null}
                    {doc.meta.family ? <span>family {doc.meta.family}</span> : null}
                    {doc.meta.version ? <span>version {doc.meta.version}</span> : null}
                    {doc.meta.effective ? <span>effective {doc.meta.effective}</span> : null}
                  </p>
                ) : null}
                <p>{doc.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeTab === "chunks" ? (
        <section className="lp-rag-lab-pane" aria-label="Chunk preview">
          {Object.entries(chunksByDoc).length === 0 ? (
            <p className="lp-rag-lab-empty">
              {previewing
                ? "Chunking…"
                : manualPreview
                  ? "Press Generate preview to run the pipeline on the selected question."
                  : "Adjust the config to preview chunks."}
            </p>
          ) : (
            Object.entries(chunksByDoc).map(([docId, chunks]) => (
              <div key={docId} className="lp-rag-lab-chunk-group">
                <h3>
                  {chunks[0]?.title ?? docId}
                  <span className="lp-rag-lab-chunk-count">
                    {chunks.length} chunk{chunks.length === 1 ? "" : "s"}
                  </span>
                </h3>
                <div className="lp-rag-lab-chunk-grid">
                  {chunks.map((chunk) => (
                    <article key={chunk.id} className="lp-rag-lab-chunk">
                      <header>
                        <code title={CHUNK_ID_TIP}>{chunk.id}</code>
                        <span>
                          {chunk.text.length} chars ·{" "}
                          {chunk.tokens ?? `~${Math.max(1, Math.ceil(chunk.text.length / 4))}`} tok
                        </span>
                      </header>
                      <p>{chunk.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      ) : null}

      {activeTab === "query" ? (
        <section className="lp-rag-lab-pane" aria-label="Query console">
          <div className="lp-rag-lab-query-bar">
            <label className="lp-rag-lab-field">
              <span>Public question</span>
              <select
                value={questionId}
                onChange={(event) => {
                  setQuestionId(event.target.value);
                  setCustomQuestion("");
                }}
              >
                {context.questions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.question}
                  </option>
                ))}
              </select>
            </label>
            <label className="lp-rag-lab-field lp-rag-lab-field--grow">
              <span>Or type a query</span>
              <input
                type="text"
                value={customQuestion}
                placeholder={activeQuestion}
                onChange={(event) => setCustomQuestion(event.target.value)}
              />
            </label>
          </div>

          <div className="lp-rag-lab-query-active">
            <span>
              {archetype === "r5" && activeClass ? `Query · routed as ${activeClass}` : "Query"}
              <InfoTip text="Pick a sample question or type your own to preview retrieval." />
            </span>
            <p>{activeQuestion}</p>
          </div>

          {preview?.rewrittenQuery ? (
            <div className="lp-rag-lab-query-active lp-rag-lab-rewrite">
              <span>
                Searched for
                <InfoTip text="Your rewrite prompt's output (first line). The first stage searches with it; the reranker still scores against the question as asked." />
              </span>
              <p>{preview.rewrittenQuery}</p>
            </div>
          ) : preview?.rewriteSkipped ? (
            <div className="lp-rag-lab-rewrite-skipped">
              <p>
                Your rewrite prompt has not run on this question, so the ranking below uses the
                question as asked. Grading runs it on every question.
              </p>
              <button
                type="button"
                className="lp-rag-lab-run"
                disabled={previewing || !activeQuestion}
                onClick={() => void runRewrite()}
              >
                {previewing ? "Rewriting…" : "Run rewrite (1 model call)"}
              </button>
            </div>
          ) : null}

          {preview ? (
            <LabReadout
              preview={preview}
              tokenGate={tokenGate}
              isPublicQuestion={isPublicQuestion}
              unanswerable={selectedQuestion?.answerable === false}
            />
          ) : null}

          {preview?.baseline && preview.baseline.length > 0 ? (
            <div className="lp-rag-lab-compare">
              <div>
                <h3>First stage</h3>
                <HitList hits={preview.baseline} />
              </div>
              <div>
                <h3>After rerank</h3>
                <HitList hits={preview.retrieved} />
              </div>
            </div>
          ) : (
            <HitList hits={preview?.retrieved ?? []} />
          )}
        </section>
      ) : null}

      {activeTab === "generate" ? (
        <section className="lp-rag-lab-pane" aria-label="Generation preview">
          {previewing ? (
            <p className="lp-rag-lab-gen-loading" role="status" aria-busy="true">
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              Generating an answer with the model. This can take several seconds…
            </p>
          ) : preview?.generation ? (
            <div className="lp-rag-lab-gen">
              <div className="lp-rag-lab-gen-meta">
                <span>{preview.refused ? "Refusal" : "Answer preview"}</span>
                <span>{preview.contextTokens} context tokens</span>
              </div>
              <pre>{preview.generation}</pre>
              {preview.citations.length > 0 ? (
                <p className="lp-rag-lab-citations">
                  Citations: {preview.citations.join(", ")}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="lp-rag-lab-empty">
              {manualPreview && !preview
                ? "Press Generate preview to run your generation prompt on the selected question."
                : "Set a generation prompt in Submission to preview an answer here."}
            </p>
          )}
          {showGenerate && preview?.retrieved && preview.retrieved.length > 0 ? (
            <div className="lp-rag-lab-context">
              <h3>
                Context passed to generator
                <InfoTip text="Top retrieved chunks stitched into the generation prompt." />
              </h3>
              <HitList hits={preview.retrieved} />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

/** One-line read of this query against what the grader measures. */
function LabReadout({
  preview,
  tokenGate,
  isPublicQuestion,
  unanswerable,
}: {
  preview: RagLabPreview;
  tokenGate: GateSpec | null;
  isPublicQuestion: boolean;
  /** Public sample the corpus cannot answer: a grounded answer should refuse. */
  unanswerable: boolean;
}) {
  const tokensOk = tokenGate ? withinGate(tokenGate, preview.contextTokens) : null;
  return (
    <dl className="lp-rag-lab-readout" aria-label="Preview readout">
      {preview.retrieval ? (
        <div>
          <dt>first stage</dt>
          <dd>{preview.retrieval}</dd>
        </div>
      ) : null}
      <div>
        <dt>{tokenGate ? gateMetricLabel(tokenGate.metric) : "context tokens"}</dt>
        <dd className={tokensOk === null ? undefined : tokensOk ? "is-pass" : "is-fail"}>
          {preview.contextTokens}
          {tokenGate ? (
            <span className="lp-rag-lab-readout-sub">
              budget {formatGateThreshold(tokenGate)} (graded as a mean over the hidden set)
            </span>
          ) : null}
        </dd>
      </div>
      <div>
        <dt>answer in context</dt>
        <dd
          className={
            preview.answerFound === null ? undefined : preview.answerFound ? "is-pass" : "is-fail"
          }
        >
          {preview.answerFound === null
            ? unanswerable
              ? "not in the corpus: expect a refusal"
              : isPublicQuestion
                ? "no answer key"
                : "custom query, no answer key"
            : preview.answerFound
              ? "yes"
              : "no"}
        </dd>
      </div>
    </dl>
  );
}

function HitList({ hits }: { hits: RagLabPreview["retrieved"] }) {
  if (hits.length === 0) {
    return <p className="lp-rag-lab-empty">No chunks retrieved yet.</p>;
  }
  return (
    <ol className="lp-rag-lab-hits">
      {hits.map((hit, index) => (
        <li
          key={hit.chunkId}
          className={`lp-rag-lab-hit${hit.containsAnswer ? " lp-rag-lab-hit--answer" : ""}`}
        >
          <div className="lp-rag-lab-hit-head">
            <span>#{index + 1}</span>
            <code title={CHUNK_ID_TIP}>{hit.chunkId}</code>
            {hit.containsAnswer ? (
              <span className="lp-rag-lab-hit-answer">contains answer</span>
            ) : null}
            <strong title={SCORE_TIP}>score {hit.score.toFixed(2)}</strong>
          </div>
          <p>{hit.text}</p>
        </li>
      ))}
    </ol>
  );
}

function groupChunks(chunks: RagLabPreview["chunks"]) {
  const groups: Record<string, RagLabPreview["chunks"]> = {};
  for (const chunk of chunks) {
    groups[chunk.docId] = groups[chunk.docId] ?? [];
    groups[chunk.docId].push(chunk);
  }
  return groups;
}
