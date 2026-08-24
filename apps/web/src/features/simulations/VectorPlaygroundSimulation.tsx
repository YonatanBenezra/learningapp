'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Layers,
  Loader2,
  Search,
  Send,
  X,
} from 'lucide-react';
import { ApiError } from '@/src/infrastructure/apiClient';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { difficultyClass } from '@/src/features/platform/problemLabels';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import {
  runSimulation,
  submitSimulation,
  type SimulationPublic,
  type VectorPlaygroundBootstrap,
  type VectorPlaygroundRunResult,
  type VectorPlaygroundSubmitResult,
} from './simulationsApi';

function useModLabel() {
  const [mod, setMod] = useState<string | null>(null);
  useEffect(() => {
    setMod(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl');
  }, []);
  return mod;
}

function DualSignal({
  cosine,
  lexicalScore,
  strong,
}: {
  cosine: number;
  lexicalScore: number;
  strong?: boolean;
}) {
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-[11px] text-ink-3">cosine</span>
        <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-line dark:bg-line-2">
          <div
            className={cn('h-full rounded-full', strong ? 'bg-primary' : 'bg-primary/45')}
            style={{ width: `${Math.max(cosine * 100, 2)}%` }}
          />
        </div>
        <span className="w-11 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-2">
          {formatCosine(cosine)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-[11px] text-ink-3">lexical</span>
        <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-line dark:bg-line-2">
          <div
            className="h-full rounded-full bg-ink-3/50"
            style={{ width: `${Math.max(lexicalScore, 2)}%` }}
          />
        </div>
        <span className="w-11 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-2">
          {lexicalScore}%
        </span>
      </div>
    </div>
  );
}

function formatCosine(value: number) {
  return value.toFixed(3);
}

function EmbeddingBadge({
  provider,
  fallback,
}: {
  provider?: 'openrouter' | 'local';
  fallback?: boolean;
}) {
  const live = provider === 'openrouter' && !fallback;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        live && 'bg-good-soft text-good',
        !live && fallback && 'bg-warn-soft text-warn',
        !live && !fallback && 'bg-bg-soft text-ink-2',
      )}
    >
      {live ? 'Live' : 'Local'}
    </span>
  );
}

export function VectorPlaygroundSimulation({
  simulation,
  bootstrap,
  embedded = false,
}: {
  simulation: SimulationPublic;
  bootstrap: VectorPlaygroundBootstrap;
  embedded?: boolean;
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
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<VectorPlaygroundRunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<VectorPlaygroundSubmitResult | null>(null);
  const [lastRunQuery, setLastRunQuery] = useState<string | null>(null);
  const [lastRunTopK, setLastRunTopK] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mod = useModLabel();

  const busy = running || submitting;
  const canSearch = Boolean(query.trim()) && !busy;
  const rankingStale = Boolean(
    runResult && (query !== lastRunQuery || topK !== lastRunTopK),
  );
  const selectedMatch = runResult?.matches.find((match) => match.id === selectedChunkId) ?? null;
  const topMatch = runResult?.matches[0] ?? null;
  const selectedStarter = bootstrap.sampleQueries.find((sample) => sample === query) ?? null;
  const scoreById = useMemo(() => {
    const map = new Map<string, VectorPlaygroundRunResult['index'][number]>();
    const rows = runResult?.index ?? runResult?.matches ?? [];
    rows.forEach((row) => {
      map.set(row.id, row);
    });
    return map;
  }, [runResult]);

  const handleRun = useCallback(async () => {
    if (!query.trim() || running || submitting) return;
    setRunning(true);
    setError(null);
    setSelectedChunkId(null);
    try {
      const result = await runSimulation(simulation.slug, { query, topK });
      if ('matches' in result) {
        setRunResult(result);
        setLastRunQuery(query);
        setLastRunTopK(topK);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed.');
    } finally {
      setRunning(false);
    }
  }, [query, topK, running, submitting, simulation.slug]);

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || !selectedChunkId || running || submitting) return;
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
  }, [query, selectedChunkId, topK, running, submitting, simulation.slug]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat) return;
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        const target = event.target;
        if (target instanceof HTMLElement && target.tagName === 'TEXTAREA') return;
        event.preventDefault();
        void handleRun();
        return;
      }
      if (!runResult || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < runResult.matches.length) {
        event.preventDefault();
        setSelectedChunkId(runResult.matches[index].id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRun, runResult]);

  const indexPanel = (
    <IndexPanel
      chunks={bootstrap.chunks}
      scoreById={scoreById}
      selectedChunkId={selectedChunkId}
      hasRanking={Boolean(runResult)}
      onSelect={(id) => {
        const row = scoreById.get(id);
        if (!row?.retrieved) return;
        setSelectedChunkId(id);
        setIndexOpen(false);
      }}
    />
  );

  const rankingPanel = (
    <RankingPanel
      running={running}
      runResult={runResult}
      rankingStale={rankingStale}
      selectedChunkId={selectedChunkId}
      selectedMatch={selectedMatch}
      topMatch={topMatch}
      submitResult={submitResult}
      submitting={submitting}
      canSubmit={Boolean(selectedChunkId) && !busy && !rankingStale}
      onSelect={setSelectedChunkId}
      onSubmit={() => void handleSubmit()}
      onOpenIndex={() => setIndexOpen(true)}
      chunkCount={bootstrap.chunks.length}
      embedded={embedded}
    />
  );

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col bg-white dark:bg-bg',
        embedded ? 'min-h-[640px]' : 'h-[calc(100dvh-50px)] flex-1',
      )}
    >
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          embedded ? 'p-4 sm:p-5' : cn(platformContainerClass, 'py-4 sm:py-5'),
        )}
      >
        <div className={cn('shrink-0', embedded ? 'mb-4' : 'mb-5')}>
          <div className="flex items-start gap-3">
            {!embedded ? (
              <Link
                href="/simulations"
                className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-bg-soft hover:text-ink"
                aria-label="All simulations"
              >
                <ArrowLeft className="size-4" />
              </Link>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-3">
                Vector Playground
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className={cn('font-semibold tracking-tight text-ink', embedded ? 'text-xl' : 'text-[22px]')}>
                  {simulation.title}
                </h1>
                <span className={cn('text-xs font-medium capitalize', difficultyClass(simulation.difficulty))}>
                  {simulation.difficulty}
                </span>
              </div>
              <p className="mt-1.5 max-w-3xl text-[15px] leading-6 text-ink-2">{simulation.taskPrompt}</p>
            </div>
            <p className="hidden shrink-0 pt-6 text-right text-xs text-ink-3 sm:block">
              {bootstrap.chunks.length} docs
              <span className="mx-1.5 text-line-2">·</span>
              cosine vs lexical
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-bg-elev shadow-card ring-1 ring-line/80 dark:bg-bg dark:ring-line-2">
          <div className="relative shrink-0 px-4 py-4 sm:px-5">
            <label htmlFor="vector-query" className="sr-only">
              Search query
            </label>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
                <input
                  ref={inputRef}
                  id="vector-query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="Ask the index something to retrieve…"
                  className="h-12 w-full rounded-xl bg-bg-soft pl-10 pr-4 text-[15px] text-ink outline-none transition placeholder:text-ink-3 focus:bg-bg-elev focus:ring-2 focus:ring-primary/20 dark:bg-bg-soft"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-bg-soft p-1">
                  {topKOptions.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={topK === value}
                      onClick={() => setTopK(value)}
                      className={cn(
                        'h-8 min-w-8 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
                        topK === value ? 'bg-primary text-primary-ink' : 'text-ink-3 hover:text-ink',
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <span className="hidden text-xs text-ink-3 sm:inline">top-k</span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleRun()}
                  disabled={!canSearch}
                  className="h-12 rounded-xl px-4 shadow-none"
                >
                  {running ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  Search
                  {mod ? (
                    <kbd className="ml-1 hidden rounded border border-current/20 px-1 font-mono text-[11px] font-normal opacity-70 md:inline">
                      {mod}+Enter
                    </kbd>
                  ) : null}
                </Button>
              </div>
            </div>

            {bootstrap.sampleQueries.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-ink-3">Try</span>
                {bootstrap.sampleQueries.map((sample) => {
                  const active = selectedStarter === sample;
                  return (
                    <button
                      key={sample}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setQuery(sample);
                        inputRef.current?.focus();
                      }}
                      className={cn(
                        'max-w-full truncate rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'bg-primary-soft text-primary'
                          : 'bg-bg-elev/80 text-ink-2 hover:bg-bg-elev hover:text-ink dark:bg-bg-soft',
                      )}
                    >
                      {sample}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {runResult ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                <EmbeddingBadge
                  provider={runResult.embeddingProvider}
                  fallback={runResult.embeddingFallback}
                />
                {runResult.embeddingModel ? (
                  <span className="font-mono text-ink-2">{runResult.embeddingModel}</span>
                ) : null}
                {runResult.embeddingDimensions ? <span>{runResult.embeddingDimensions}d</span> : null}
                {typeof runResult.latencyMs === 'number' ? (
                  <span className="tabular-nums">{runResult.latencyMs}ms</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {runResult?.embeddingWarning ? (
            <div
              className="flex shrink-0 items-start justify-between gap-3 bg-warn-soft/80 px-4 py-2.5 text-[15px] text-warn sm:px-5"
              role="status"
            >
              <p>{runResult.embeddingWarning}</p>
            </div>
          ) : null}

          {error ? (
            <div
              className="flex shrink-0 items-start justify-between gap-3 bg-bad-soft px-4 py-2.5 text-[15px] text-bad sm:px-5"
              role="alert"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="rounded-md p-0.5 hover:bg-bad/10"
                aria-label="Dismiss error"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">{rankingPanel}</div>
            <aside className="hidden w-[300px] shrink-0 bg-bg-soft/50 xl:flex xl:w-[320px] dark:bg-bg-soft/20">
              {indexPanel}
            </aside>
          </div>
        </div>
      </div>

      {indexOpen ? (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/25"
            aria-label="Close index"
            onClick={() => setIndexOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-[min(100%,340px)] flex-col bg-bg-elev shadow-elevated dark:bg-bg">
            <div className="flex items-center justify-between border-b border-line px-3 py-2 dark:border-line-2">
              <span className="text-[15px] font-medium text-ink">Index</span>
              <button
                type="button"
                onClick={() => setIndexOpen(false)}
                className="rounded-lg p-1.5 text-ink-3 hover:bg-bg-soft hover:text-ink"
                aria-label="Close index"
              >
                <X className="size-4" />
              </button>
            </div>
            {indexPanel}
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function IndexPanel({
  chunks,
  scoreById,
  selectedChunkId,
  hasRanking,
  onSelect,
}: {
  chunks: VectorPlaygroundBootstrap['chunks'];
  scoreById: Map<string, VectorPlaygroundRunResult['index'][number]>;
  selectedChunkId: string | null;
  hasRanking: boolean;
  onSelect: (id: string) => void;
}) {
  const retrievedCount = [...scoreById.values()].filter((row) => row.retrieved).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-baseline justify-between gap-2 px-4 py-3">
        <p className="text-[13px] font-semibold text-ink">Index</p>
        <p className="text-xs text-ink-3">
          {hasRanking ? `${retrievedCount}/${chunks.length} retrieved` : `${chunks.length} chunks`}
        </p>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {chunks.map((chunk) => {
          const row = scoreById.get(chunk.id);
          const selected = selectedChunkId === chunk.id;
          const missed = Boolean(hasRanking && row && !row.retrieved);
          return (
            <li key={chunk.id}>
              <button
                type="button"
                disabled={Boolean(hasRanking && !row?.retrieved)}
                onClick={() => onSelect(chunk.id)}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left transition',
                  selected && 'bg-primary-soft/80 dark:bg-primary/10',
                  !selected && row?.retrieved && 'hover:bg-bg-elev/80',
                  missed && 'opacity-70',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13px] font-medium text-ink">{chunk.source}</p>
                  {row ? (
                    <span className="shrink-0 font-mono text-[11px] text-ink-3">
                      {row.retrieved ? `#${row.rank}` : 'out'}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-ink-2">{chunk.text}</p>
                {row ? (
                  <DualSignal cosine={row.cosine} lexicalScore={row.lexicalScore} strong={row.rank === 1 || selected} />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RankingPanel({
  running,
  runResult,
  rankingStale,
  selectedChunkId,
  selectedMatch,
  topMatch,
  submitResult,
  submitting,
  canSubmit,
  onSelect,
  onSubmit,
  onOpenIndex,
  chunkCount,
  embedded,
}: {
  running: boolean;
  runResult: VectorPlaygroundRunResult | null;
  rankingStale: boolean;
  selectedChunkId: string | null;
  selectedMatch: VectorPlaygroundRunResult['matches'][number] | null;
  topMatch: VectorPlaygroundRunResult['matches'][number] | null;
  submitResult: VectorPlaygroundSubmitResult | null;
  submitting: boolean;
  canSubmit: boolean;
  onSelect: (id: string) => void;
  onSubmit: () => void;
  onOpenIndex: () => void;
  chunkCount: number;
  embedded: boolean;
}) {
  const delta =
    selectedMatch && topMatch && selectedMatch.id !== topMatch.id
      ? selectedMatch.cosine - topMatch.cosine
      : null;

  const lexicalTop = runResult?.index
    ? [...runResult.index].sort((a, b) => b.lexicalScore - a.lexicalScore)[0]
    : undefined;
  const lexicalDisagrees = Boolean(
    lexicalTop && runResult?.matches[0] && lexicalTop.id !== runResult.matches[0].id,
  );

  return (
    <section className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink">Ranking</p>
          <p className="text-xs text-ink-3">
            {runResult
              ? `${runResult.matches.length} of ${runResult.index?.length ?? chunkCount} retrieved · cosine vs lexical`
              : 'Search to rank the index by cosine similarity'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenIndex}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink-2 hover:bg-bg-soft hover:text-ink xl:hidden"
        >
          <Layers className="size-3.5" />
          Index
          <span className="tabular-nums text-ink-3">{chunkCount}</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {!runResult ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-bg-soft text-ink-3">
              <Search className="size-5" />
            </div>
            <p className="mt-4 text-[15px] font-medium text-ink">No ranking yet</p>
            <p className="mt-1 max-w-sm text-[13px] leading-5 text-ink-3">
              Run a query against the index. Matches appear here by similarity — then choose the chunk that
              actually answers the question.
            </p>
          </div>
        ) : (
          <ol>
            {runResult.matches.map((match, index) => {
              const selected = selectedChunkId === match.id;
              const top = index === 0;
              return (
                <li key={match.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(match.id)}
                    aria-pressed={selected}
                    className={cn(
                      'w-full rounded-xl px-3 py-3.5 text-left transition sm:px-3',
                      selected
                        ? 'bg-primary-soft/70 dark:bg-primary/10'
                        : 'hover:bg-bg-soft/80',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'mt-0.5 w-6 shrink-0 font-mono text-xl font-semibold tabular-nums',
                          selected || top ? 'text-primary' : 'text-ink-3',
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate text-[15px] font-medium text-ink">{match.source}</p>
                          <span
                            className={cn(
                              'shrink-0 font-mono text-[15px] font-semibold tabular-nums',
                              selected || top ? 'text-primary' : 'text-ink-2',
                            )}
                          >
                            {formatCosine(match.cosine)}
                          </span>
                        </div>
                        <DualSignal
                          cosine={match.cosine}
                          lexicalScore={match.lexicalScore}
                          strong={selected || top}
                        />
                        {match.lexicalTerms.length > 0 ? (
                          <p className="mt-1.5 text-xs text-ink-3">
                            overlap {match.lexicalTerms.slice(0, 4).join(', ')}
                            {match.lexicalTerms.length > 4 ? '…' : ''}
                          </p>
                        ) : (
                          <p className="mt-1.5 text-xs text-ink-3">no lexical overlap</p>
                        )}
                        <p className="mt-2.5 text-[15px] leading-6 text-ink-2">{match.text}</p>
                        {top ? (
                          <span className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wider text-primary">
                            Highest cosine
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {runResult ? (
        <div className="shrink-0 px-4 py-3 sm:px-5">
          {rankingStale ? (
            <p className="mb-3 text-xs text-warn">Query changed — search again before submitting.</p>
          ) : null}
          {lexicalDisagrees && !submitResult ? (
            <p className="mb-3 text-xs leading-5 text-ink-3">
              Cosine and lexical ranks disagree — that is the point of embeddings.
            </p>
          ) : null}
          {runResult.hints[0] && !submitResult && !lexicalDisagrees ? (
            <p className="mb-3 text-xs leading-5 text-ink-3">{runResult.hints[0]}</p>
          ) : null}

          {submitResult ? (
            <div
              className={cn(
                'mb-3 rounded-xl px-3 py-3',
                submitResult.passed ? 'bg-good-soft' : 'bg-warn-soft',
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className={cn(
                    'text-xs font-semibold',
                    submitResult.passed ? 'text-good' : 'text-warn',
                  )}
                >
                  {submitResult.passed ? 'Passed' : 'Try again'}
                </span>
                <span className="font-mono text-[15px] font-semibold tabular-nums text-ink">
                  cos {formatCosine(submitResult.topCosine ?? submitResult.selectedCosine ?? submitResult.score / 100)}
                </span>
                {submitResult.passed ? (
                  <span className="text-xs text-ink-3">highest cosine in the index</span>
                ) : (
                  <span className="text-xs text-ink-3">
                    your pick cos {formatCosine(submitResult.selectedCosine ?? 0)}
                    {submitResult.selectedRank ? ` · rank ${submitResult.selectedRank}` : ''}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[15px] leading-6 text-ink-2">{submitResult.feedback}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 text-xs leading-5 text-ink-3">
              {selectedMatch
                ? `${selectedMatch.source} · cos ${formatCosine(selectedMatch.cosine)} · lex ${selectedMatch.lexicalScore}%${
                    delta !== null ? ` · ${delta > 0 ? '+' : ''}${formatCosine(delta)} vs top` : ''
                  }`
                : 'Select a retrieved chunk to submit'}
            </p>
            <Button
              type="button"
              size="sm"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="h-9 rounded-lg px-4 shadow-none"
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Submit pick
            </Button>
          </div>
        </div>
      ) : !embedded ? (
        <p className="hidden px-5 py-3 text-xs text-ink-3 sm:block">Press 1–5 after search to pick a rank.</p>
      ) : null}

      {running ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-bg-elev/75 backdrop-blur-[1px] dark:bg-bg/75"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-[15px] text-ink-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            Ranking by cosine…
          </div>
        </div>
      ) : null}
    </section>
  );
}
