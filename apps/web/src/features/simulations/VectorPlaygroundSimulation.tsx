'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Circle,
  Loader2,
  Search,
  Send,
} from 'lucide-react';
import { ApiError } from '@/src/infrastructure/apiClient';
import { buttonClasses } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import {
  runSimulation,
  submitSimulation,
  type SimulationPublic,
  type VectorPlaygroundBootstrap,
  type VectorPlaygroundRunResult,
  type VectorPlaygroundSubmitResult,
} from './simulationsApi';

function ScoreMeter({ value, active }: { value: number; active?: boolean }) {
  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-line dark:bg-line-2">
        <div
          className={cn('h-full rounded-full transition-all duration-500', active ? 'bg-primary' : 'bg-ink-3/40')}
          style={{ width: `${Math.max(value, 6)}%` }}
        />
      </div>
      <span className={cn('w-9 text-right tabular-nums text-sm font-medium', active ? 'text-primary' : 'text-ink-2')}>
        {value}%
      </span>
    </div>
  );
}

export function VectorPlaygroundSimulation({
  simulation,
  bootstrap,
}: {
  simulation: SimulationPublic;
  bootstrap: VectorPlaygroundBootstrap;
}) {
  const defaultTopK = bootstrap.topKRange?.default ?? 3;
  const topKOptions = useMemo(
    () =>
      Array.from(
        { length: (bootstrap.topKRange?.max ?? 5) - (bootstrap.topKRange?.min ?? 1) + 1 },
        (_, i) => (bootstrap.topKRange?.min ?? 1) + i,
      ),
    [bootstrap.topKRange],
  );

  const [query, setQuery] = useState(bootstrap.defaultQuery);
  const [topK, setTopK] = useState(defaultTopK);
  const [corpusOpen, setCorpusOpen] = useState(false);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<VectorPlaygroundRunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<VectorPlaygroundSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phase = submitResult ? 2 : runResult ? 1 : 0;
  const selectedMatch = runResult?.matches.find((match) => match.id === selectedChunkId) ?? null;
  const selectedCorpus = bootstrap.chunks.find((chunk) => chunk.id === selectedChunkId);

  async function handleRun() {
    if (!query.trim()) return;
    setRunning(true);
    setError(null);
    setSubmitResult(null);
    setSelectedChunkId(null);
    try {
      const result = await runSimulation(simulation.slug, { query, topK });
      if ('matches' in result) {
        setRunResult(result);
        if (result.matches[0]) setSelectedChunkId(result.matches[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed.');
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit() {
    if (!query.trim() || !selectedChunkId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitSimulation(simulation.slug, { query, selectedChunkId, topK });
      if ('submissionId' in result && 'topMatchId' in result) {
        setSubmitResult(result);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg pb-24 lg:pb-8">
      <div className={cn(platformContainerClass, 'mx-auto w-full max-w-4xl py-6 lg:py-8')}>
        <Link
          href="/simulations"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          Back to simulations
        </Link>

        <header className="mt-5 border-b border-line pb-6 dark:border-line-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Vector Playground</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{simulation.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">{simulation.description}</p>
          <p className="mt-3 text-xs text-ink-3">
            {bootstrap.chunks.length} documents in index · cosine similarity ranking
            {runResult?.embeddingModel ? (
              <>
                {' '}
                · <span className="font-mono">{runResult.embeddingModel}</span>
              </>
            ) : null}
          </p>
        </header>

        {/* Progress — minimal, not a heavy stepper */}
        <ol className="mt-6 flex flex-wrap gap-4 text-sm">
          {[
            { label: 'Search', done: phase >= 1, current: phase === 0 },
            { label: 'Compare results', done: phase >= 1, current: phase === 1 && !submitResult },
            { label: 'Submit answer', done: phase >= 2, current: phase === 2 },
          ].map((step) => (
            <li key={step.label} className="flex items-center gap-2">
              {step.done ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : (
                <Circle className={cn('size-4', step.current ? 'text-primary' : 'text-ink-3')} />
              )}
              <span className={cn(step.done || step.current ? 'font-medium text-ink' : 'text-ink-3')}>
                {step.label}
              </span>
            </li>
          ))}
        </ol>

        {/* Task */}
        <section className="mt-6 rounded-2xl border border-line bg-bg-elev p-5 shadow-[var(--shadow-xs)] dark:border-line-2">
          <h2 className="text-sm font-semibold text-ink">Your task</h2>
          <p className="mt-2 text-sm leading-6 text-ink-2">{simulation.taskPrompt}</p>
        </section>

        {/* Search */}
        <section className="mt-4 rounded-2xl border border-line bg-bg-elev p-5 shadow-[var(--shadow-xs)] dark:border-line-2">
          <label htmlFor="vector-query" className="text-sm font-semibold text-ink">
            Search query
          </label>
          <p className="mt-1 text-xs text-ink-3">Write a question, run search, then pick the best matching chunk.</p>
          <textarea
            id="vector-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            spellCheck={false}
            className="mt-4 w-full resize-none rounded-xl border border-line-2 bg-bg px-4 py-3 text-sm leading-6 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-line-2 dark:bg-bg-soft"
            placeholder="e.g. How can I reduce hallucinations in a RAG assistant?"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-ink-2">
                Results
                <select
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="rounded-lg border border-line-2 bg-bg px-3 py-1.5 text-sm text-ink outline-none focus:border-primary dark:border-line-2 dark:bg-bg-soft"
                >
                  {topKOptions.map((value) => (
                    <option key={value} value={value}>
                      Top {value}
                    </option>
                  ))}
                </select>
              </label>

              {bootstrap.sampleQueries?.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-ink-3">Examples</span>
                  {bootstrap.sampleQueries.slice(0, 3).map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setQuery(sample)}
                      className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-2 transition hover:border-primary/40 hover:text-primary dark:border-line-2"
                    >
                      {sample.length > 42 ? `${sample.slice(0, 42)}…` : sample}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void handleRun()}
              disabled={running || submitting || !query.trim()}
              className={buttonClasses({
                size: 'sm',
                className: 'hidden h-10 w-full rounded-xl px-5 shadow-none sm:inline-flex sm:w-auto',
              })}
            >
              {running ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Run search
            </button>
          </div>
        </section>

        {/* Corpus — collapsed by default, optional reference */}
        <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-bg-elev dark:border-line-2">
          <button
            type="button"
            onClick={() => setCorpusOpen((open) => !open)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-bg-soft/60 dark:hover:bg-bg-soft/20"
          >
            <div>
              <p className="text-sm font-semibold text-ink">Knowledge base</p>
              <p className="mt-0.5 text-xs text-ink-3">{bootstrap.chunks.length} indexed chunks — expand to read full text</p>
            </div>
            <ChevronDown className={cn('size-4 text-ink-3 transition', corpusOpen && 'rotate-180')} />
          </button>
          {corpusOpen ? (
            <div className="border-t border-line px-5 py-4 dark:border-line-2">
              <ul className="divide-y divide-line dark:divide-line-2">
                {bootstrap.chunks.map((chunk, index) => (
                  <li key={chunk.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-ink">{chunk.source}</p>
                      <span className="shrink-0 font-mono text-[10px] text-ink-3">doc-{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-ink-2">{chunk.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* Results table */}
        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-ink">Search results</h2>
              <p className="mt-0.5 text-xs text-ink-3">
                {runResult
                  ? `${runResult.matches.length} matches · select the chunk that best answers your query`
                  : 'Run a search to see ranked matches'}
              </p>
            </div>
            {runResult?.matches[0] ? (
              <p className="text-xs text-ink-3">
                Highest score:{' '}
                <span className="font-semibold tabular-nums text-primary">{runResult.matches[0].score}%</span>
              </p>
            ) : null}
          </div>

          {!runResult ? (
            <div className="rounded-2xl border border-dashed border-line-2 bg-bg-soft/50 px-6 py-14 text-center dark:bg-bg-lav/10">
              <Search className="mx-auto size-8 text-ink-3" />
              <p className="mt-3 text-sm font-medium text-ink">No results yet</p>
              <p className="mt-1 text-sm text-ink-3">Enter a query above and run search to compare similarity scores.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-[var(--shadow-xs)] dark:border-line-2">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg-soft/80 text-xs font-medium uppercase tracking-wide text-ink-3 dark:border-line-2 dark:bg-bg-soft/40">
                      <th className="w-12 px-4 py-3" scope="col">
                        Pick
                      </th>
                      <th className="w-14 px-2 py-3" scope="col">
                        Rank
                      </th>
                      <th className="px-3 py-3" scope="col">
                        Document
                      </th>
                      <th className="w-36 px-3 py-3" scope="col">
                        Similarity
                      </th>
                      <th className="px-4 py-3" scope="col">
                        Excerpt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {runResult.matches.map((match, index) => {
                      const selected = selectedChunkId === match.id;
                      return (
                        <tr
                          key={match.id}
                          className={cn(
                            'border-b border-line last:border-0 dark:border-line-2',
                            selected && 'bg-primary-soft/40 dark:bg-primary/10',
                          )}
                        >
                          <td className="px-4 py-4">
                            <input
                              type="radio"
                              name="vector-chunk"
                              checked={selected}
                              onChange={() => setSelectedChunkId(match.id)}
                              aria-label={`Select ${match.source}`}
                              className="size-4 accent-[var(--primary)]"
                            />
                          </td>
                          <td className="px-2 py-4 tabular-nums text-ink-2">#{index + 1}</td>
                          <td className="px-3 py-4">
                            <p className="font-medium text-ink">{match.source}</p>
                            {index === 0 ? (
                              <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-primary">
                                Best match
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-4">
                            <ScoreMeter value={match.score} active={selected || index === 0} />
                          </td>
                          <td className="px-4 py-4 text-ink-2">
                            <p className="line-clamp-2 leading-6">{match.text}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {runResult?.hints[0] ? (
            <p className="mt-3 text-xs leading-5 text-ink-3">{runResult.hints[0]}</p>
          ) : null}
        </section>

        {/* Selected preview */}
        {selectedMatch ? (
          <section className="mt-4 rounded-2xl border border-primary/20 bg-primary-soft/30 p-5 dark:bg-primary/10">
            <h3 className="text-sm font-semibold text-ink">Your selection</h3>
            <p className="mt-1 text-xs text-ink-3">{selectedCorpus?.source ?? selectedMatch.source}</p>
            <p className="mt-3 text-sm leading-7 text-ink-2">{selectedMatch.text}</p>
          </section>
        ) : null}

        {/* Desktop submit */}
        {runResult ? (
          <div className="mt-6 hidden justify-end sm:flex">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={running || submitting || !selectedChunkId}
              className={buttonClasses({
                size: 'sm',
                className: 'h-10 rounded-xl px-6 shadow-none',
              })}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Submit answer
            </button>
          </div>
        ) : null}

        {/* Grade */}
        {submitResult ? (
          <section
            className={cn(
              'mt-6 rounded-2xl border p-5',
              submitResult.passed
                ? 'border-good/30 bg-good-soft/60'
                : 'border-warn/30 bg-warn-soft/50',
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold',
                  submitResult.passed ? 'bg-good/15 text-good' : 'bg-warn/15 text-warn',
                )}
              >
                {submitResult.passed ? 'Passed' : 'Try again'}
              </span>
              <span className="text-lg font-semibold tabular-nums text-ink">{submitResult.score}%</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-2">{submitResult.feedback}</p>
          </section>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {/* Mobile sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg-elev/95 p-4 backdrop-blur-sm dark:border-line-2 sm:hidden">
        <div className="mx-auto flex max-w-4xl gap-2">
          <button
            type="button"
            onClick={() => void handleRun()}
            disabled={running || submitting || !query.trim()}
            className={buttonClasses({
              variant: 'outline',
              size: 'sm',
              className: 'h-11 flex-1 rounded-xl shadow-none',
            })}
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Search
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={running || submitting || !selectedChunkId || !runResult}
            className={buttonClasses({
              size: 'sm',
              className: 'h-11 flex-1 rounded-xl shadow-none',
            })}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
