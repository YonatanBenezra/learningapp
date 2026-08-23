'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Braces,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Play,
  Send,
  Sparkles,
} from 'lucide-react';
import { ApiError } from '@/src/infrastructure/apiClient';
import { buttonClasses } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import {
  runSimulation,
  submitSimulation,
  type PromptLabBootstrap,
  type PromptLabRunResult,
  type PromptLabSubmitResult,
  type SimulationPublic,
} from './simulationsApi';

const STEPS = ['Draft prompt', 'Live run', 'Grade output'] as const;

function RubricCard({
  label,
  score,
  maxScore,
  note,
}: {
  label: string;
  score: number;
  maxScore: number;
  note?: string;
}) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return (
    <div className="rounded-lg border border-line/80 bg-bg-elev p-4 dark:border-line-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">{label}</p>
        <span className="tabular-nums text-sm font-semibold text-primary">
          {score}/{maxScore}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line/80 dark:bg-line-2">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {note ? <p className="mt-2 text-xs leading-5 text-ink-3">{note}</p> : null}
    </div>
  );
}

export function PromptLabSimulation({
  simulation,
  bootstrap,
}: {
  simulation: SimulationPublic;
  bootstrap: PromptLabBootstrap | null;
}) {
  const defaultPrompt = bootstrap?.defaultPrompt ?? 'Summarize the product review below.';
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [modelOutput, setModelOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<PromptLabRunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<PromptLabSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeStep = submitResult ? 2 : runResult ? 1 : 0;

  const structuralChecks = useMemo(() => {
    if (!runResult?.structural) return [];
    return [
      { ok: runResult.structural.validJson, label: 'Valid JSON' },
      {
        ok: runResult.structural.hasTitleKey && runResult.structural.hasSummaryKey,
        label: 'Required keys',
      },
      { ok: runResult.structural.markdownFree, label: 'No markdown' },
    ];
  }, [runResult?.structural]);

  async function handleRun() {
    if (!prompt.trim()) return;
    setRunning(true);
    setError(null);
    setSubmitResult(null);
    try {
      const result = await runSimulation(simulation.slug, { prompt });
      if ('output' in result) {
        setRunResult(result);
        setModelOutput(result.output);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Run failed.');
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit() {
    if (!prompt.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitSimulation(simulation.slug, {
        prompt,
        modelOutput: modelOutput ?? undefined,
      });
      if ('submissionId' in result && 'rubricBreakdown' in result) {
        setSubmitResult(result);
        setModelOutput(result.output);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-bg">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 border-b border-line bg-bg-elev/95 backdrop-blur-sm dark:border-line-2">
        <div className={cn(platformContainerClass, 'flex flex-wrap items-center gap-x-4 gap-y-3 py-3')}>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
            <Link
              href="/simulations"
              className="inline-flex items-center gap-1.5 text-ink-3 transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-4" />
              Simulations
            </Link>
            <ChevronRight className="size-3.5 shrink-0 text-ink-3" />
            <div className="min-w-0 truncate">
              <span className="font-medium text-ink">{simulation.title}</span>
              <span className="mx-2 text-ink-3">·</span>
              <span className="text-ink-3">Prompt Lab</span>
            </div>
          </div>

          {runResult?.model ? (
            <span className="hidden rounded-md border border-line bg-bg-soft px-2.5 py-1 font-mono text-[11px] text-ink-2 lg:inline dark:border-line-2">
              {runResult.model}
            </span>
          ) : null}

          <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
            <button
              type="button"
              onClick={() => void handleRun()}
              disabled={running || submitting || !prompt.trim()}
              className={buttonClasses({
                variant: 'outline',
                size: 'sm',
                className: 'h-9 flex-1 rounded-lg px-4 shadow-none sm:flex-none',
              })}
            >
              {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              Run
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={running || submitting || !prompt.trim()}
              className={buttonClasses({
                size: 'sm',
                className: 'h-9 flex-1 rounded-lg px-4 shadow-none sm:flex-none',
              })}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Submit
            </button>
          </div>
        </div>
      </div>

      <div className={cn(platformContainerClass, 'py-6')}>
        {/* Progress */}
        <div className="mb-6 flex items-center gap-2 sm:gap-0">
          {STEPS.map((label, index) => {
            const done = index < activeStep;
            const current = index === activeStep;
            return (
              <div key={label} className="flex min-w-0 flex-1 items-center">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold',
                      done && 'bg-primary text-primary-ink',
                      current && !done && 'border-2 border-primary text-primary',
                      !done && !current && 'border border-line text-ink-3 dark:border-line-2',
                    )}
                  >
                    {done ? <CheckCircle2 className="size-3.5" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      'hidden truncate text-sm sm:inline',
                      current || done ? 'font-medium text-ink' : 'text-ink-3',
                    )}
                  >
                    {label}
                  </span>
                </div>
                {index < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      'mx-2 hidden h-px flex-1 sm:block',
                      index < activeStep ? 'bg-primary/40' : 'bg-line dark:bg-line-2',
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Context */}
        <div className="mb-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-bg-elev p-5 dark:border-line-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              <Sparkles className="size-3.5 text-primary" />
              Mission
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-2">{simulation.taskPrompt}</p>
          </div>
          <div className="rounded-xl border border-line bg-bg-elev p-5 dark:border-line-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              <Braces className="size-3.5 text-primary" />
              Fixed input
            </div>
            <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-bg-soft px-3 py-3 font-mono text-xs leading-6 text-ink-2 dark:bg-bg-soft/50">
              {simulation.sampleInput}
            </pre>
          </div>
        </div>

        {bootstrap?.starterPrompts ? (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-ink-3">Starters</span>
            {bootstrap.starterPrompts.map((starter) => (
              <button
                key={starter.id}
                type="button"
                onClick={() => setPrompt(starter.prompt)}
                className="rounded-lg border border-line bg-bg-elev px-3 py-1.5 text-xs font-medium text-ink-2 transition hover:border-primary/30 hover:text-primary dark:border-line-2"
              >
                {starter.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Workbench */}
        <div className="overflow-hidden rounded-xl border border-line bg-bg-elev dark:border-line-2">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-line-2">
            <h2 className="text-sm font-semibold text-ink">Workbench</h2>
            {runResult ? (
              <span className="text-xs text-ink-3">
                Structural score ·{' '}
                <span className="font-medium tabular-nums text-primary">{runResult.qualityScore}%</span>
              </span>
            ) : null}
          </div>

          <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-line dark:lg:divide-line-2">
            <div className="flex min-h-[400px] flex-col">
              <div className="border-b border-line px-4 py-2 dark:border-line-2">
                <span className="text-xs font-medium text-ink-3">Your prompt</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                spellCheck={false}
                className="min-h-[320px] flex-1 resize-none bg-transparent px-4 py-4 font-mono text-sm leading-7 text-ink outline-none placeholder:text-ink-3"
                placeholder="Instruct the model how to handle the fixed input..."
              />
              {runResult?.hints.length ? (
                <div className="border-t border-line bg-bg-soft/60 px-4 py-3 dark:border-line-2 dark:bg-bg-soft/30">
                  <ul className="space-y-1 text-xs leading-5 text-ink-2">
                    {runResult.hints.slice(0, 3).map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="flex min-h-[400px] flex-col border-t border-line lg:border-t-0 dark:border-line-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2 dark:border-line-2">
                <span className="text-xs font-medium text-ink-3">Model response</span>
                {structuralChecks.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {structuralChecks.map((check) => (
                      <span
                        key={check.label}
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[10px] font-medium',
                          check.ok ? 'bg-good-soft text-good' : 'bg-warn-soft text-warn',
                        )}
                      >
                        {check.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex-1 overflow-auto px-4 py-4">
                {runResult ? (
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-ink">{runResult.output}</pre>
                ) : (
                  <p className="text-sm leading-6 text-ink-3">
                    Run your prompt to preview the live model response before submitting.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation */}
        {submitResult ? (
          <section className="mt-6 rounded-xl border border-line bg-bg-elev p-5 dark:border-line-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold',
                  submitResult.passed ? 'bg-good-soft text-good' : 'bg-warn-soft text-warn',
                )}
              >
                {submitResult.passed ? 'Passed' : 'Needs improvement'}
              </span>
              <span className="text-lg font-semibold tabular-nums text-ink">{submitResult.score}%</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-2">{submitResult.feedback}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {submitResult.rubricBreakdown.map((item) => (
                <RubricCard
                  key={item.criterion}
                  label={item.criterion}
                  score={item.score}
                  maxScore={item.maxScore}
                  note={item.note}
                />
              ))}
            </div>
          </section>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
