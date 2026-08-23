'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Play, Send } from 'lucide-react';
import { ApiError } from '@/src/infrastructure/apiClient';
import { buttonClasses } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import { SimulationPanel } from './SimulationPanel';
import {
  runSimulation,
  submitSimulation,
  type RagChunkSize,
  type RagPipelineBootstrap,
  type RagPipelineRunResult,
  type SimulationPublic,
  type SimulationSubmitResult,
} from './simulationsApi';

export function RagPipelineSimulation({
  simulation,
  bootstrap,
}: {
  simulation: SimulationPublic;
  bootstrap: RagPipelineBootstrap;
}) {
  const [query, setQuery] = useState(bootstrap.defaultQuery);
  const [chunkSize, setChunkSize] = useState<RagChunkSize>(bootstrap.defaultConfig.chunkSize);
  const [topK, setTopK] = useState(bootstrap.defaultConfig.topK);
  const [rerank, setRerank] = useState(bootstrap.defaultConfig.rerank);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RagPipelineRunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SimulationSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configBody = { query, chunkSize, topK, rerank };

  async function handleRun() {
    if (!query.trim()) return;
    setRunning(true);
    setError(null);
    setSubmitResult(null);
    try {
      const result = await runSimulation(simulation.slug, configBody);
      if ('answer' in result) setRunResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Pipeline run failed.');
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit() {
    if (!query.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitSimulation(simulation.slug, configBody);
      setSubmitResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn(platformContainerClass, 'flex-1 py-6')}>
      <Link
        href="/simulations"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        All simulations
      </Link>

      <header className="mt-4 mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">RAG Pipeline</p>
        <h1 className="mt-1 text-xl font-semibold text-ink">{simulation.title}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-2">{simulation.description}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <SimulationPanel title="Goal">
            <p className="text-sm leading-6 text-ink-2">{simulation.taskPrompt}</p>
          </SimulationPanel>

          <SimulationPanel title="Source document">
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-bg-soft px-3 py-3 text-sm leading-6 text-ink-2 dark:bg-bg-lav/30">
              {bootstrap.sourcePreview}
            </pre>
          </SimulationPanel>

          <SimulationPanel title="Pipeline settings">
            <label className="block text-xs font-medium text-ink-3">User question</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-line-2 bg-bg-soft px-3 py-2.5 text-sm leading-6 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:bg-bg-lav/20"
              spellCheck={false}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="chunk-size" className="block text-xs font-medium text-ink-3">
                  Chunk size
                </label>
                <select
                  id="chunk-size"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(e.target.value as RagChunkSize)}
                  className="mt-1 w-full rounded-md border border-line-2 bg-bg-soft px-3 py-2 text-sm text-ink outline-none focus:border-primary dark:bg-bg-lav/20"
                >
                  {bootstrap.chunkSizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="top-k" className="block text-xs font-medium text-ink-3">
                  Top-k · {topK}
                </label>
                <input
                  id="top-k"
                  type="range"
                  min={bootstrap.topKRange.min}
                  max={bootstrap.topKRange.max}
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="mt-3 w-full accent-primary"
                />
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-ink-2">
              <input
                type="checkbox"
                checked={rerank}
                onChange={(e) => setRerank(e.target.checked)}
                className="rounded border-line-2"
              />
              Enable reranking
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleRun()}
                disabled={running || submitting || !query.trim()}
                className={buttonClasses({
                  variant: 'outline',
                  size: 'sm',
                  className: 'h-9 rounded-md px-4 shadow-none',
                })}
              >
                {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                Run pipeline
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={running || submitting || !query.trim()}
                className={buttonClasses({
                  size: 'sm',
                  className: 'h-9 rounded-md px-4 shadow-none',
                })}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submit config
              </button>
            </div>
          </SimulationPanel>
        </section>

        <section className="space-y-4">
          <SimulationPanel title="Retrieved chunks (mock index)">
            {runResult ? (
              <ul className="space-y-2">
                {runResult.chunks.map((chunk) => (
                  <li
                    key={chunk.id}
                    className={cn(
                      'rounded-md border px-3 py-2.5 text-sm leading-6',
                      chunk.retrieved
                        ? 'border-primary/40 bg-primary/5 text-ink'
                        : 'border-line/50 bg-bg-soft text-ink-3 dark:bg-bg-lav/15',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium">{chunk.id}</span>
                      <span className="tabular-nums text-ink-3">{chunk.score}%</span>
                    </div>
                    <p className="mt-1">{chunk.text}</p>
                    {chunk.retrieved ? (
                      <span className="mt-2 inline-block text-[11px] font-medium uppercase tracking-wide text-primary">
                        In context
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-3">Run the pipeline to see ranked and retrieved chunks.</p>
            )}
          </SimulationPanel>

          <SimulationPanel title="Model answer (mock)">
            {runResult ? (
              <>
                <p
                  className={cn(
                    'text-xs font-medium uppercase tracking-wide',
                    runResult.grounded ? 'text-good' : 'text-warn',
                  )}
                >
                  {runResult.grounded ? 'Grounded in retrieval' : 'Likely hallucination'}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink">{runResult.answer}</p>
                <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap rounded-md bg-bg-soft px-3 py-2 text-xs leading-5 text-ink-3 dark:bg-bg-lav/20">
                  {runResult.retrievedContext}
                </pre>
                {runResult.hints.length > 0 ? (
                  <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
                    {runResult.hints.map((hint) => (
                      <li key={hint}>• {hint}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-ink-3">Run the pipeline to preview the generated answer.</p>
            )}
          </SimulationPanel>

          {submitResult ? (
            <SimulationPanel title="Result">
              <p
                className={cn(
                  'text-sm font-medium',
                  submitResult.passed ? 'text-good' : 'text-warn',
                )}
              >
                {submitResult.passed ? 'Passed' : 'Needs improvement'} · {submitResult.score}%
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-2">{submitResult.feedback}</p>
            </SimulationPanel>
          ) : null}

          {error ? (
            <p className="rounded-md border border-bad/25 bg-bad-soft/40 px-3 py-2 text-sm text-bad" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
