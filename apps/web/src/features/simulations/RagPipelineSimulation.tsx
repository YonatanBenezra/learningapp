'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Play, Send, X } from 'lucide-react';
import { ApiError } from '@/src/infrastructure/apiClient';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { difficultyClass } from '@/src/features/platform/problemLabels';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import {
  runSimulation,
  submitSimulation,
  type RagChunkSize,
  type RagPipelineBootstrap,
  type RagPipelineRunResult,
  type RagPipelineSubmitResult,
  type SimulationPublic,
} from './simulationsApi';

type StageId = 'source' | 'retrieve' | 'context' | 'answer';

function useModLabel() {
  const [mod, setMod] = useState<string | null>(null);
  useEffect(() => {
    setMod(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl');
  }, []);
  return mod;
}

function formatCosine(value: number) {
  return value.toFixed(3);
}

function chunkCountFor(size: RagChunkSize) {
  if (size === 'small') return 5;
  if (size === 'medium') return 3;
  return 1;
}

function groupSections(
  sections: Array<{ id: string; text: string }>,
  chunkSize: RagChunkSize,
) {
  if (chunkSize === 'small') {
    return sections.map((section) => ({ key: section.id, sections: [section] }));
  }
  if (chunkSize === 'medium') {
    return [
      { key: 'medium-0', sections: sections.slice(0, 2) },
      { key: 'medium-1', sections: sections.slice(2, 4) },
      { key: 'medium-2', sections: sections.slice(4) },
    ].filter((group) => group.sections.length > 0);
  }
  return [{ key: 'full-policy', sections }];
}

export function RagPipelineSimulation({
  simulation,
  bootstrap,
  embedded = false,
}: {
  simulation: SimulationPublic;
  bootstrap: RagPipelineBootstrap;
  embedded?: boolean;
}) {
  const defaultTopK = bootstrap.topKRange?.default ?? 1;
  const topKOptions = useMemo(
    () =>
      Array.from(
        { length: (bootstrap.topKRange?.max ?? 5) - (bootstrap.topKRange?.min ?? 1) + 1 },
        (_, i) => (bootstrap.topKRange?.min ?? 1) + i,
      ),
    [bootstrap.topKRange],
  );
  const sections = bootstrap.sections?.length
    ? bootstrap.sections
    : bootstrap.sourcePreview.split(/\n\n+/).map((text, index) => ({ id: `section-${index}`, text }));

  const [query, setQuery] = useState(bootstrap.defaultQuery);
  const [chunkSize, setChunkSize] = useState<RagChunkSize>(bootstrap.defaultConfig.chunkSize);
  const [topK, setTopK] = useState(defaultTopK);
  const [rerank, setRerank] = useState(bootstrap.defaultConfig.rerank);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RagPipelineRunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<RagPipelineSubmitResult | null>(null);
  const [lastRun, setLastRun] = useState<{
    query: string;
    chunkSize: RagChunkSize;
    topK: number;
    rerank: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<StageId>('source');
  const inputRef = useRef<HTMLInputElement>(null);
  const mod = useModLabel();

  const busy = running || submitting;
  const canRun = Boolean(query.trim()) && !busy;
  const rankingStale = Boolean(
    runResult &&
      lastRun &&
      (query !== lastRun.query ||
        chunkSize !== lastRun.chunkSize ||
        topK !== lastRun.topK ||
        rerank !== lastRun.rerank),
  );
  const canSubmit = Boolean(runResult) && !busy && !rankingStale;
  const selectedStarter = bootstrap.sampleQueries?.find((sample) => sample === query) ?? null;
  const groups = useMemo(() => groupSections(sections, chunkSize), [sections, chunkSize]);

  const handleRun = useCallback(async () => {
    if (!query.trim() || running || submitting) return;
    setRunning(true);
    setError(null);
    setSubmitResult(null);
    try {
      const result = await runSimulation(simulation.slug, { query, chunkSize, topK, rerank });
      if ('answer' in result && 'grounded' in result) {
        setRunResult(result);
        setLastRun({ query, chunkSize, topK, rerank });
        setStage(result.grounded ? 'answer' : result.goldInContext ? 'context' : 'retrieve');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Pipeline run failed.');
    } finally {
      setRunning(false);
    }
  }, [query, chunkSize, topK, rerank, running, submitting, simulation.slug]);

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || !runResult || rankingStale || running || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitSimulation(simulation.slug, { query, chunkSize, topK, rerank });
      if ('submissionId' in result && 'goldInContext' in result) {
        setSubmitResult(result);
        setStage('answer');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }, [query, chunkSize, topK, rerank, runResult, rankingStale, running, submitting, simulation.slug]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat) return;
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        const target = event.target;
        if (target instanceof HTMLElement && target.tagName === 'TEXTAREA') return;
        event.preventDefault();
        void handleRun();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRun]);

  const retrievedIds = new Set(
    (runResult?.chunks ?? []).filter((chunk) => chunk.retrieved).flatMap((chunk) => chunk.sectionIds),
  );
  const goldIds = new Set(sections.filter((section) => /non-refundable/i.test(section.text)).map((section) => section.id));
  const conflictIds = new Set(
    sections.filter((section) => /30-day refund|30-day return/i.test(section.text)).map((section) => section.id),
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
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-3">RAG Pipeline</p>
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
              {sections.length} passages
              <span className="mx-1.5 text-line-2">·</span>
              chunk → retrieve → generate
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-bg-elev shadow-card ring-1 ring-line/80 dark:bg-bg dark:ring-line-2">
          <div className="shrink-0 px-4 py-4 sm:px-5">
            <label htmlFor="rag-query" className="sr-only">
              User question
            </label>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <input
                ref={inputRef}
                id="rag-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                placeholder="Ask the policy document…"
                className="h-12 min-w-0 flex-1 rounded-xl bg-bg-soft px-4 text-[15px] text-ink outline-none transition placeholder:text-ink-3 focus:bg-bg-elev focus:ring-2 focus:ring-primary/20 dark:bg-bg-soft"
              />
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl bg-bg-soft p-1">
                  {bootstrap.chunkSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={chunkSize === option.value}
                      onClick={() => setChunkSize(option.value)}
                      className={cn(
                        'h-8 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
                        chunkSize === option.value ? 'bg-primary text-primary-ink' : 'text-ink-3 hover:text-ink',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
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
                <button
                  type="button"
                  aria-pressed={rerank}
                  onClick={() => setRerank((value) => !value)}
                  className={cn(
                    'h-10 rounded-xl px-3 text-[13px] font-medium transition-colors',
                    rerank ? 'bg-primary text-primary-ink' : 'bg-bg-soft text-ink-2 hover:text-ink',
                  )}
                >
                  Rerank
                </button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleRun()}
                  disabled={!canRun}
                  className="h-12 rounded-xl px-4 shadow-none"
                >
                  {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                  Run
                  {mod ? (
                    <kbd className="ml-1 hidden rounded border border-current/20 px-1 font-mono text-[11px] font-normal opacity-70 md:inline">
                      {mod}+Enter
                    </kbd>
                  ) : null}
                </Button>
              </div>
            </div>

            {bootstrap.sampleQueries?.length ? (
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

            <PipelineStrip
              runResult={runResult}
              rankingStale={rankingStale}
              chunkCount={chunkCountFor(chunkSize)}
              stage={stage}
              onStage={setStage}
            />
          </div>

          {runResult?.embeddingWarning ? (
            <div className="flex shrink-0 items-start justify-between gap-3 bg-warn-soft/80 px-4 py-2.5 text-[15px] text-warn sm:px-5" role="status">
              <p>{runResult.embeddingWarning}</p>
            </div>
          ) : null}

          {error ? (
            <div className="flex shrink-0 items-start justify-between gap-3 bg-bad-soft px-4 py-2.5 text-[15px] text-bad sm:px-5" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => setError(null)} className="rounded-md p-0.5 hover:bg-bad/10" aria-label="Dismiss error">
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1">
            <StageColumn
              className={cn('min-w-0 flex-1', stage !== 'source' && 'hidden xl:flex')}
              label="Source"
              hint={`${chunkCountFor(chunkSize)} chunks`}
            >
              <SourceStage
                groups={groups}
                retrievedIds={retrievedIds}
                goldIds={goldIds}
                conflictIds={conflictIds}
                hasRun={Boolean(runResult)}
              />
            </StageColumn>
            <StageColumn
              className={cn('min-w-0 flex-1 bg-bg-soft/50 dark:bg-bg-soft/20', stage !== 'retrieve' && 'hidden xl:flex')}
              label="Retrieve"
              hint={runResult ? `${runResult.chunks.filter((c) => c.retrieved).length} in window` : 'cosine, then rerank'}
            >
              <RetrieveStage runResult={runResult} rerank={lastRun?.rerank ?? rerank} />
            </StageColumn>
            <StageColumn
              className={cn('min-w-0 flex-1', stage !== 'context' && 'hidden xl:flex')}
              label="Context"
              hint={runResult ? `${runResult.retrievedContext.length} chars` : 'stuffed into the model'}
            >
              <ContextStage runResult={runResult} />
            </StageColumn>
            <StageColumn
              className={cn('min-w-0 flex-1 bg-bg-soft/50 dark:bg-bg-soft/20', stage !== 'answer' && 'hidden xl:flex')}
              label="Answer"
              hint={runResult ? (runResult.grounded ? 'grounded' : 'hallucinated') : 'after retrieve'}
            >
              <AnswerStage runResult={runResult} />
            </StageColumn>
          </div>

          <div className="shrink-0 px-4 py-3 sm:px-5">
            {rankingStale ? (
              <p className="mb-3 text-xs text-warn">Config changed — run the pipeline again before submitting.</p>
            ) : null}
            {runResult && !submitResult && runResult.hints[0] ? (
              <p className="mb-3 text-xs leading-5 text-ink-3">{runResult.hints[0]}</p>
            ) : null}

            {submitResult ? (
              <div className={cn('mb-3 rounded-xl px-3 py-3', submitResult.passed ? 'bg-good-soft' : 'bg-warn-soft')}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className={cn('text-xs font-semibold', submitResult.passed ? 'text-good' : 'text-warn')}>
                    {submitResult.passed ? 'Passed' : 'Try again'}
                  </span>
                  <span className="font-mono text-[15px] font-semibold tabular-nums text-ink">
                    {submitResult.passed
                      ? `cos ${formatCosine(submitResult.goldCosine ?? submitResult.score / 100)}`
                      : `${submitResult.evidencePrecision}% evidence`}
                  </span>
                  <span className="text-xs text-ink-3">
                    {submitResult.passed
                      ? 'exception in context, no 30-day mix'
                      : submitResult.goldInContext
                        ? 'exception retrieved, context still mixed'
                        : `gold rank ${submitResult.goldRank ?? '—'}`}
                  </span>
                </div>
                <p className="mt-1.5 text-[15px] leading-6 text-ink-2">{submitResult.feedback}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 text-xs leading-5 text-ink-3">
                {runResult
                  ? runResult.grounded
                    ? `Grounded · gold rank ${runResult.goldRank} · ${runResult.evidencePrecision}% of context is the exception`
                    : `Not grounded · gold rank ${runResult.goldRank ?? '—'} · precision ${runResult.evidencePrecision}%`
                  : 'Run the pipeline, then submit a config that keeps the answer grounded.'}
              </p>
              <Button
                type="button"
                size="sm"
                variant={runResult && !rankingStale ? 'primary' : 'outline'}
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
                className="h-9 rounded-lg px-4 shadow-none"
              >
                {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Submit config
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineStrip({
  runResult,
  rankingStale,
  chunkCount,
  stage,
  onStage,
}: {
  runResult: RagPipelineRunResult | null;
  rankingStale: boolean;
  chunkCount: number;
  stage: StageId;
  onStage: (id: StageId) => void;
}) {
  const steps: Array<{ id: StageId; label: string; detail: string; tone: 'idle' | 'good' | 'warn' }> = [
    {
      id: 'source',
      label: 'Source',
      detail: `${chunkCount} chunks`,
      tone: 'idle',
    },
    {
      id: 'retrieve',
      label: 'Retrieve',
      detail: runResult ? `gold #${runResult.goldRank ?? '—'}` : 'not run',
      tone: !runResult || rankingStale ? 'idle' : runResult.goldRank === 1 ? 'good' : 'warn',
    },
    {
      id: 'context',
      label: 'Context',
      detail: !runResult || rankingStale ? 'empty' : runResult.contextConflict ? 'mixed' : runResult.goldInContext ? 'clean' : 'missed',
      tone: !runResult || rankingStale ? 'idle' : runResult.goldInContext && !runResult.contextConflict ? 'good' : 'warn',
    },
    {
      id: 'answer',
      label: 'Answer',
      detail: !runResult || rankingStale ? '—' : runResult.grounded ? 'grounded' : 'hallucinated',
      tone: !runResult || rankingStale ? 'idle' : runResult.grounded ? 'good' : 'warn',
    },
  ];

  return (
    <div className="mt-4 flex gap-1 overflow-x-auto">
      {steps.map((step, index) => (
        <button
          key={step.id}
          type="button"
          onClick={() => onStage(step.id)}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition xl:pointer-events-none xl:cursor-default',
            stage === step.id ? 'bg-bg-soft dark:bg-bg-soft/80' : 'hover:bg-bg-soft/60 xl:hover:bg-transparent',
          )}
        >
          <span
            className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full font-mono text-[11px] font-semibold',
              step.tone === 'good' && 'bg-good-soft text-good',
              step.tone === 'warn' && 'bg-warn-soft text-warn',
              step.tone === 'idle' && 'bg-bg-soft text-ink-3',
            )}
          >
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-ink">{step.label}</span>
            <span className="block truncate text-xs text-ink-3">{step.detail}</span>
          </span>
        </button>
      ))}
      {runResult ? (
        <div className="hidden shrink-0 items-center gap-2 pl-2 text-xs text-ink-3 xl:flex">
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
              runResult.embeddingProvider === 'openrouter' && !runResult.embeddingFallback
                ? 'bg-good-soft text-good'
                : 'bg-warn-soft text-warn',
            )}
          >
            {runResult.embeddingProvider === 'openrouter' && !runResult.embeddingFallback ? 'Live' : 'Local'}
          </span>
          {runResult.embeddingModel ? <span className="font-mono text-ink-2">{runResult.embeddingModel}</span> : null}
          {typeof runResult.latencyMs === 'number' ? <span className="tabular-nums">{runResult.latencyMs}ms</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function StageColumn({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex shrink-0 items-baseline justify-between gap-2 px-4 py-3">
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        <p className="truncate text-xs text-ink-3">{hint}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
    </section>
  );
}

function SourceStage({
  groups,
  retrievedIds,
  goldIds,
  conflictIds,
  hasRun,
}: {
  groups: Array<{ key: string; sections: Array<{ id: string; text: string }> }>;
  retrievedIds: Set<string>;
  goldIds: Set<string>;
  conflictIds: Set<string>;
  hasRun: boolean;
}) {
  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const inWindow = hasRun && group.sections.some((section) => retrievedIds.has(section.id));
        const hasGold = group.sections.some((section) => goldIds.has(section.id));
        const hasConflict = group.sections.some((section) => conflictIds.has(section.id));
        return (
          <div
            key={group.key}
            className={cn(
              'rounded-xl px-3 py-2.5',
              inWindow && hasGold && !hasConflict && 'bg-good-soft/70',
              inWindow && hasConflict && 'bg-warn-soft/70',
              inWindow && !hasGold && !hasConflict && 'bg-primary-soft/60',
              !inWindow && 'bg-bg-soft/80 dark:bg-bg-soft/40',
            )}
          >
            {group.sections.map((section) => (
              <p key={section.id} className="text-[15px] leading-6 text-ink-2">
                {section.text}
              </p>
            ))}
            {inWindow ? (
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                {hasGold && !hasConflict ? 'Exception in window' : hasConflict ? 'Conflicting policy' : 'In context'}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function RetrieveStage({
  runResult,
  rerank,
}: {
  runResult: RagPipelineRunResult | null;
  rerank: boolean;
}) {
  if (!runResult) {
    return (
      <p className="pt-6 text-[13px] leading-5 text-ink-3">
        Run to rank chunks by cosine. Rerank blends lexical overlap and boosts the exception span.
      </p>
    );
  }

  return (
    <ol className="space-y-1">
      {runResult.chunks.map((chunk) => {
        const moved = rerank && chunk.cosineRank !== chunk.rank;
        return (
          <li
            key={chunk.id}
            className={cn(
              'rounded-xl px-3 py-2.5',
              chunk.retrieved && chunk.gold && 'bg-good-soft/60',
              chunk.retrieved && chunk.conflict && 'bg-warn-soft/60',
              chunk.retrieved && !chunk.gold && !chunk.conflict && 'bg-primary-soft/50',
              !chunk.retrieved && 'opacity-55',
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className={cn('font-mono text-[15px] font-semibold tabular-nums', chunk.retrieved ? 'text-primary' : 'text-ink-3')}>
                {chunk.rank}
              </span>
              <span className="font-mono text-[13px] tabular-nums text-ink-2">
                {rerank ? `rerank ${formatCosine(chunk.rerankScore)}` : `cos ${formatCosine(chunk.cosine)}`}
              </span>
            </div>
            <p className="mt-1 text-[15px] leading-6 text-ink-2">{chunk.text}</p>
            <p className="mt-1.5 text-xs text-ink-3">
              cos {formatCosine(chunk.cosine)}
              {chunk.lexicalTerms.length > 0 ? ` · overlap ${chunk.lexicalTerms.slice(0, 3).join(', ')}` : ' · no lexical overlap'}
              {moved ? ` · was #${chunk.cosineRank}` : ''}
              {chunk.gold ? ' · exception' : ''}
              {!chunk.retrieved ? ' · out' : ''}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function ContextStage({ runResult }: { runResult: RagPipelineRunResult | null }) {
  if (!runResult) {
    return (
      <p className="pt-6 text-[13px] leading-5 text-ink-3">
        Retrieved chunks are concatenated here. Extra top-k or a full-document chunk mixes policies.
      </p>
    );
  }

  const retrieved = runResult.chunks.filter((chunk) => chunk.retrieved);
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-3">
        {runResult.goldInContext ? 'Exception present' : 'Exception missing'}
        <span className="mx-1.5 text-line-2">·</span>
        {runResult.contextConflict ? 'conflicting 30-day rule also stuffed' : 'no conflicting window'}
        <span className="mx-1.5 text-line-2">·</span>
        {runResult.evidencePrecision}% evidence
      </p>
      {retrieved.map((chunk) => (
        <p key={chunk.id} className={cn('text-[15px] leading-6', chunk.gold ? 'text-ink' : 'text-ink-2')}>
          {chunk.text}
        </p>
      ))}
    </div>
  );
}

function AnswerStage({ runResult }: { runResult: RagPipelineRunResult | null }) {
  if (!runResult) {
    return (
      <p className="pt-6 text-[13px] leading-5 text-ink-3">
        The mock generator stays inside retrieved context when the exception is the only refund rule in the window.
      </p>
    );
  }

  return (
    <div>
      <p
        className={cn(
          'text-xs font-semibold uppercase tracking-wide',
          runResult.grounded ? 'text-good' : 'text-warn',
        )}
      >
        {runResult.grounded ? 'Grounded in retrieval' : 'Likely hallucination'}
      </p>
      <p className="mt-2 text-[15px] leading-6 text-ink">{runResult.answer}</p>
    </div>
  );
}
