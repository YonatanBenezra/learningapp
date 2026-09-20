"use client";

import { useEffect, useMemo, useState } from "react";
import { InfoTip } from "./info-tip";
import { ragLabApi } from "../rag-lab/rag-lab-api";
import {
  CHUNK_ID_TIP,
  LAB_TAB_LABELS,
  labTabsForArchetype,
  SCORE_TIP,
  type LabTab,
} from "../rag-lab/rag-lab-copy";
import type { RagLabContext, RagLabPreview } from "../rag-lab/rag-lab-types";
import "../rag-lab.css";

type RagLabPanelProps = {
  slug: string;
  payload: Record<string, unknown>;
};

export function RagLabPanel({ slug, payload }: RagLabPanelProps) {
  const [context, setContext] = useState<RagLabContext | null>(null);
  const [preview, setPreview] = useState<RagLabPreview | null>(null);
  const [tab, setTab] = useState<LabTab>("corpus");
  const [questionId, setQuestionId] = useState<string>("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      .catch(() => {
        if (!cancelled) {
          setError("Could not load the RAG lab for this exercise.");
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

  const activeQuestion = useMemo(() => {
    if (customQuestion.trim()) {
      return customQuestion.trim();
    }
    const picked = context?.questions.find((item) => item.id === questionId);
    return picked?.question ?? "";
  }, [context, questionId, customQuestion]);

  useEffect(() => {
    if (!context?.labEnabled || !activeQuestion) {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setPreviewing(true);
      ragLabApi
        .preview(slug, payload, activeQuestion)
        .then((result) => {
          if (!cancelled) {
            setPreview(result);
            setError(null);
          }
        })
        .catch((caught: unknown) => {
          if (!cancelled) {
            setPreview(null);
            setError(
              caught instanceof Error
                ? caught.message
                : "Preview failed — check your config fields.",
            );
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
  }, [slug, payload, activeQuestion, context?.labEnabled]);

  const archetype = preview?.archetype ?? context?.archetype ?? "unknown";
  const visibleTabs = useMemo(() => labTabsForArchetype(archetype), [archetype]);
  const showGenerate = visibleTabs.includes("generate");

  useEffect(() => {
    if (!visibleTabs.includes(tab)) {
      setTab(visibleTabs[0] ?? "corpus");
    }
  }, [tab, visibleTabs]);

  if (loading) {
    return (
      <div className="lp-rag-lab lp-rag-lab--loading">
        <p>Loading simulation lab…</p>
      </div>
    );
  }

  if (!context?.labEnabled) {
    return (
      <div className="lp-rag-lab lp-rag-lab--disabled">
        <p>This sandbox exercise uses the Python editor. Run your retriever code, then submit to grade.</p>
      </div>
    );
  }

  const chunksByDoc = groupChunks(preview?.chunks ?? []);

  return (
    <div className="lp-rag-lab">
      <div className="lp-rag-lab-head">
        <div>
          <h2 className="lp-rag-lab-title">Simulation Lab</h2>
          <p className="lp-rag-lab-lead">
            Optional preview on the public corpus. Submit from Configure to grade the hidden
            set.
          </p>
        </div>
        {context.frozen || preview?.frozen ? (
          <div className="lp-rag-lab-frozen" aria-label="Frozen pipeline settings">
            <span className="lp-rag-lab-frozen-label">
              {(preview?.frozen ?? context.frozen)?.label}
            </span>
            {(preview?.frozen ?? context.frozen)?.items.map((item) => (
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
            aria-selected={tab === item}
            className={`lp-rag-lab-tab${tab === item ? " is-active" : ""}`}
            onClick={() => setTab(item)}
          >
            {LAB_TAB_LABELS[item]}
          </button>
        ))}
        <span className={`lp-rag-lab-status${previewing ? " is-busy" : ""}`}>
          {previewing ? "Updating…" : preview ? `${preview.chunkCount} chunks` : "—"}
        </span>
      </div>

      {error ? <p className="lp-rag-lab-error">{error}</p> : null}

      {tab === "corpus" ? (
        <section className="lp-rag-lab-pane" aria-label="Corpus documents">
          <ul className="lp-rag-lab-corpus">
            {context.corpus.map((doc) => (
              <li key={doc.id} className="lp-rag-lab-doc">
                <div className="lp-rag-lab-doc-head">
                  <strong>{doc.title}</strong>
                  <span>{doc.id}</span>
                </div>
                <p>{doc.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "chunks" ? (
        <section className="lp-rag-lab-pane" aria-label="Chunk preview">
          {Object.entries(chunksByDoc).length === 0 ? (
            <p className="lp-rag-lab-empty">Adjust config to preview chunks.</p>
          ) : (
            Object.entries(chunksByDoc).map(([docId, chunks]) => (
              <div key={docId} className="lp-rag-lab-chunk-group">
                <h3>{chunks[0]?.title ?? docId}</h3>
                <div className="lp-rag-lab-chunk-grid">
                  {chunks.map((chunk) => (
                    <article key={chunk.id} className="lp-rag-lab-chunk">
                      <header>
                        <code title={CHUNK_ID_TIP}>{chunk.id}</code>
                        <span>{chunk.text.length} chars</span>
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

      {tab === "query" ? (
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
              Query
              <InfoTip text="Pick a sample question or type your own to preview retrieval." />
            </span>
            <p>{activeQuestion}</p>
          </div>

          {preview?.baseline && preview.baseline.length > 0 ? (
            <div className="lp-rag-lab-compare">
              <div>
                <h3>Baseline retrieve</h3>
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

      {tab === "generate" ? (
        <section className="lp-rag-lab-pane" aria-label="Generation preview">
          {preview?.generation ? (
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
              Set a generation prompt in Configure to preview an answer here.
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

function HitList({ hits }: { hits: RagLabPreview["retrieved"] }) {
  if (hits.length === 0) {
    return <p className="lp-rag-lab-empty">No chunks retrieved yet.</p>;
  }
  return (
    <ol className="lp-rag-lab-hits">
      {hits.map((hit, index) => (
        <li key={hit.chunkId} className="lp-rag-lab-hit">
          <div className="lp-rag-lab-hit-head">
            <span>#{index + 1}</span>
            <code title={CHUNK_ID_TIP}>{hit.chunkId}</code>
            <strong title={SCORE_TIP}>score {hit.score}</strong>
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
