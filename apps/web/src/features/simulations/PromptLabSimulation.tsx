'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Copy,
  FileJson,
  Loader2,
  PanelLeft,
  Play,
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
  type PromptLabBootstrap,
  type PromptLabRunResult,
  type PromptLabSubmitResult,
  type SimulationPublic,
} from './simulationsApi';

const STRUCTURAL_LABELS = [
  { key: 'validJson' as const, label: 'Valid JSON' },
  { key: 'requiredKeys' as const, label: 'Required keys' },
  { key: 'markdownFree' as const, label: 'No markdown' },
];

function useModLabel() {
  const [mod, setMod] = useState<string | null>(null);
  useEffect(() => {
    setMod(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl');
  }, []);
  return mod;
}

function formatTokens(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function prettyOutput(raw: string, validJson?: boolean) {
  if (!validJson) return raw;
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function CheckChip({
  label,
  state,
}: {
  label: string;
  state: 'idle' | 'ok' | 'fail';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
        state === 'idle' && 'bg-bg-soft text-ink-3',
        state === 'ok' && 'bg-good-soft text-good',
        state === 'fail' && 'bg-warn-soft text-warn',
      )}
    >
      {label}
    </span>
  );
}

function RubricRow({
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
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-ink">{label}</p>
        <span className="shrink-0 tabular-nums text-xs font-medium text-ink-2">
          {score}/{maxScore}
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line dark:bg-line-2">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {note ? <p className="mt-1.5 text-xs leading-5 text-ink-3">{note}</p> : null}
    </div>
  );
}

function BriefBody({
  simulation,
  bootstrap,
  submitResult,
  gradeStale,
  tab,
  onTabChange,
}: {
  simulation: SimulationPublic;
  bootstrap: PromptLabBootstrap | null;
  submitResult: PromptLabSubmitResult | null;
  gradeStale: boolean;
  tab: 'task' | 'results';
  onTabChange: (tab: 'task' | 'results') => void;
}) {
  const criteria = bootstrap?.rubricCriteria ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 gap-1 border-b border-line px-3 py-2 dark:border-line-2">
        {(
          [
            { id: 'task', label: 'Task' },
            { id: 'results', label: 'Results' },
          ] as const
        ).map((item) => {
          const disabled = item.id === 'results' && !submitResult;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                active && 'bg-bg-soft text-ink dark:bg-bg-lav/40',
                !active && !disabled && 'text-ink-3 hover:text-ink',
                disabled && 'cursor-not-allowed text-ink-3/50',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === 'results' && submitResult ? (
          <div className="space-y-5">
            {gradeStale ? (
              <p className="rounded-lg bg-warn-soft px-3 py-2 text-xs leading-5 text-warn">
                Prompt changed since this grade. Run and submit again to re-score.
              </p>
            ) : null}
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold',
                    submitResult.passed ? 'bg-good-soft text-good' : 'bg-warn-soft text-warn',
                  )}
                >
                  {submitResult.passed ? 'Passed' : 'Needs work'}
                </span>
                <span className="text-2xl font-semibold tabular-nums tracking-tight text-ink">
                  {submitResult.score}%
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink-2">{submitResult.feedback}</p>
            </div>
            <div className="space-y-4">
              {submitResult.rubricBreakdown.map((item) => (
                <RubricRow
                  key={item.criterion}
                  label={item.criterion}
                  score={item.score}
                  maxScore={item.maxScore}
                  note={item.note}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-3">Objective</p>
              <p className="mt-2 text-sm leading-6 text-ink">{simulation.taskPrompt}</p>
            </section>

            <section>
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-3">Fixed input</p>
              <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap rounded-lg bg-bg-soft px-3 py-2.5 font-mono text-[12px] leading-5 text-ink-2 dark:bg-bg-lav/30">
                {simulation.sampleInput}
              </pre>
            </section>

            {criteria.length > 0 ? (
              <section>
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-3">Rubric</p>
                <ul className="mt-2 space-y-2">
                  {criteria.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink-2">{item.label}</span>
                      <span className="tabular-nums text-xs text-ink-3">{item.maxScore} pts</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function PromptLabSimulation({
  simulation,
  bootstrap,
  embedded = false,
}: {
  simulation: SimulationPublic;
  bootstrap: PromptLabBootstrap | null;
  embedded?: boolean;
}) {
  const defaultPrompt = bootstrap?.defaultPrompt ?? 'Summarize the product review below.';
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<PromptLabRunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<PromptLabSubmitResult | null>(null);
  const [lastRunPrompt, setLastRunPrompt] = useState<string | null>(null);
  const [lastSubmitPrompt, setLastSubmitPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [railTab, setRailTab] = useState<'task' | 'results'>('task');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mod = useModLabel();

  const promptDirty = Boolean(runResult && lastRunPrompt !== null && prompt !== lastRunPrompt);
  const gradeStale = Boolean(submitResult && lastSubmitPrompt !== null && prompt !== lastSubmitPrompt);
  const hasPreview = Boolean(runResult);
  const hasGrade = Boolean(submitResult);
  const busy = running || submitting;
  const canRun = Boolean(prompt.trim()) && !busy;

  const selectedStarterId = useMemo(() => {
    const match = bootstrap?.starterPrompts.find((starter) => starter.prompt === prompt);
    return match?.id ?? null;
  }, [bootstrap?.starterPrompts, prompt]);

  const structural = useMemo(() => {
    const checks = runResult?.structural;
    return STRUCTURAL_LABELS.map((item) => {
      if (!checks) return { label: item.label, state: 'idle' as const };
      const ok =
        item.key === 'requiredKeys'
          ? checks.hasTitleKey && checks.hasSummaryKey
          : checks[item.key];
      return { label: item.label, state: ok ? ('ok' as const) : ('fail' as const) };
    });
  }, [runResult?.structural]);

  const handleRun = useCallback(async () => {
    if (!prompt.trim() || running || submitting) return;
    setRunning(true);
    setError(null);
    try {
      const result = await runSimulation(simulation.slug, { prompt });
      if ('output' in result) {
        setRunResult(result);
        setLastRunPrompt(prompt);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Run failed.');
    } finally {
      setRunning(false);
    }
  }, [prompt, running, submitting, simulation.slug]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || running || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitSimulation(simulation.slug, {
        prompt,
        modelOutput: prompt === lastRunPrompt ? (runResult?.output ?? undefined) : undefined,
      });
      if ('submissionId' in result && 'rubricBreakdown' in result) {
        setSubmitResult(result);
        setRunResult((current) =>
          current
            ? { ...current, output: result.output, structural: result.structural }
            : {
                output: result.output,
                qualityScore: result.structural.structuralScore,
                hints: [],
                structural: result.structural,
              },
        );
        setLastRunPrompt(prompt);
        setLastSubmitPrompt(prompt);
        setRailTab('results');
        if (window.matchMedia('(max-width: 1023px)').matches) setBriefOpen(true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }, [prompt, running, submitting, simulation.slug, lastRunPrompt, runResult?.output]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key !== 'Enter' || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT') return;
        if (tag === 'TEXTAREA' && target !== textareaRef.current) return;
      }
      event.preventDefault();
      void handleRun();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRun]);

  async function copyOutput() {
    const text = runResult?.output;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }

  const phaseLabel = hasGrade ? 'Graded' : hasPreview ? 'Previewed' : 'Draft';

  const actions = (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={hasPreview && !hasGrade ? 'outline' : 'primary'}
        onClick={() => void handleRun()}
        disabled={!canRun}
        className="h-8 rounded-lg px-3 shadow-none"
      >
        {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
        Run
        {mod ? (
          <kbd className="ml-1 hidden rounded border border-current/20 px-1 font-mono text-[10px] font-normal opacity-70 sm:inline">
            {mod}+Enter
          </kbd>
        ) : null}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={hasPreview && !hasGrade ? 'primary' : 'outline'}
        onClick={() => void handleSubmit()}
        disabled={!canRun}
        className="h-8 rounded-lg px-3 shadow-none"
      >
        {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        Submit
      </Button>
    </div>
  );

  const brief = (
    <BriefBody
      simulation={simulation}
      bootstrap={bootstrap}
      submitResult={submitResult}
      gradeStale={gradeStale}
      tab={railTab}
      onTabChange={setRailTab}
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
          !embedded && cn(platformContainerClass, 'py-4 sm:py-5'),
        )}
      >
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden border border-line bg-bg-elev shadow-card dark:border-line-2 dark:bg-bg',
            embedded ? 'rounded-xl' : 'rounded-2xl',
          )}
        >
          <header className="relative shrink-0 border-b border-line bg-gradient-to-r from-primary-soft via-primary-soft/35 to-bg-elev after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-gradient-to-r after:from-primary/50 after:via-primary/20 after:to-transparent dark:border-line-2 dark:from-primary/15 dark:via-primary/[0.06] dark:to-bg">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {!embedded ? (
                  <Link
                    href="/simulations"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-bg-elev/80 hover:text-ink"
                    aria-label="All simulations"
                  >
                    <ArrowLeft className="size-4" />
                  </Link>
                ) : (
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                    <FileJson className="size-4" />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <h1 className="truncate text-sm font-semibold text-ink">{simulation.title}</h1>
                    <span
                      className={cn(
                        'hidden capitalize sm:inline text-[11px] font-medium',
                        difficultyClass(simulation.difficulty),
                      )}
                    >
                      {simulation.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-3">
                    Prompt Lab
                    <span className="mx-1.5 text-line-2">·</span>
                    {phaseLabel}
                    {runResult?.model ? (
                      <>
                        <span className="mx-1.5 text-line-2">·</span>
                        <span className="font-mono">{runResult.model}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                {!embedded ? (
                  <button
                    type="button"
                    onClick={() => setBriefOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:bg-bg-elev/80 hover:text-ink lg:hidden"
                  >
                    <PanelLeft className="size-3.5" />
                    Brief
                  </button>
                ) : null}
                {actions}
              </div>
            </div>
          </header>

          {error ? (
            <div
              className="flex shrink-0 items-start justify-between gap-3 border-b border-bad/20 bg-bad-soft px-4 py-2.5 text-sm text-bad sm:px-5"
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
            {!embedded ? (
              <aside className="hidden w-[300px] shrink-0 flex-col border-r border-line lg:flex xl:w-[320px] dark:border-line-2">
                {brief}
              </aside>
            ) : null}

            {embedded ? (
              <div className="flex min-h-0 w-full flex-col lg:flex-row">
                <aside className="max-h-[280px] shrink-0 border-b border-line lg:max-h-none lg:w-[280px] lg:border-b-0 lg:border-r dark:border-line-2">
                  {brief}
                </aside>
                <Workbench
                  prompt={prompt}
                  onPromptChange={(value) => {
                    setPrompt(value);
                  }}
                  textareaRef={textareaRef}
                  starters={bootstrap?.starterPrompts ?? []}
                  selectedStarterId={selectedStarterId}
                  running={running}
                  runResult={runResult}
                  structural={structural}
                  promptDirty={promptDirty}
                  copied={copied}
                  onCopy={() => void copyOutput()}
                />
              </div>
            ) : (
              <Workbench
                prompt={prompt}
                onPromptChange={setPrompt}
                textareaRef={textareaRef}
                starters={bootstrap?.starterPrompts ?? []}
                selectedStarterId={selectedStarterId}
                running={running}
                runResult={runResult}
                structural={structural}
                promptDirty={promptDirty}
                copied={copied}
                onCopy={() => void copyOutput()}
              />
            )}
          </div>
        </div>
      </div>

      {briefOpen && !embedded ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/25"
            aria-label="Close brief"
            onClick={() => setBriefOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,320px)] flex-col bg-bg-elev shadow-elevated dark:bg-bg">
            <div className="flex items-center justify-between border-b border-line px-3 py-2 dark:border-line-2">
              <span className="text-sm font-medium text-ink">Brief</span>
              <button
                type="button"
                onClick={() => setBriefOpen(false)}
                className="rounded-lg p-1.5 text-ink-3 hover:bg-bg-soft hover:text-ink"
                aria-label="Close brief"
              >
                <X className="size-4" />
              </button>
            </div>
            {brief}
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function Workbench({
  prompt,
  onPromptChange,
  textareaRef,
  starters,
  selectedStarterId,
  running,
  runResult,
  structural,
  promptDirty,
  copied,
  onCopy,
}: {
  prompt: string;
  onPromptChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  starters: Array<{ id: string; label: string; prompt: string }>;
  selectedStarterId: string | null;
  running: boolean;
  runResult: PromptLabRunResult | null;
  structural: Array<{ label: string; state: 'idle' | 'ok' | 'fail' }>;
  promptDirty: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  const displayed = runResult ? prettyOutput(runResult.output, runResult.structural?.validJson) : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-line md:border-b-0 md:border-r dark:border-line-2">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-3 py-2 dark:border-line-2">
          <span className="text-xs font-medium text-ink-2">Prompt</span>
          {starters.length > 0 ? (
            <div className="ml-auto flex flex-wrap gap-1">
              {starters.map((starter) => {
                const selected = starter.id === selectedStarterId;
                return (
                  <button
                    key={starter.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onPromptChange(starter.prompt)}
                    className={cn(
                      'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                      selected
                        ? 'bg-primary-soft text-primary'
                        : 'text-ink-3 hover:bg-bg-soft hover:text-ink',
                    )}
                  >
                    {starter.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          spellCheck={false}
          className="min-h-[240px] flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-6 text-ink outline-none placeholder:text-ink-3 md:min-h-0"
          placeholder="Instruct the model how to handle the fixed input…"
          aria-label="Your prompt"
        />
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-4 py-2 text-[11px] text-ink-3 dark:border-line-2">
          <span className="tabular-nums">{prompt.length} characters</span>
          {runResult?.hints.length ? (
            <span className="truncate text-ink-2">{runResult.hints[0]}</span>
          ) : (
            <span>Edit the prompt, then run a live preview</span>
          )}
        </div>
      </section>

      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-3 py-2 dark:border-line-2">
          <span className="text-xs font-medium text-ink-2">Response</span>
          <div className="flex flex-wrap gap-1">
            {structural.map((check) => (
              <CheckChip key={check.label} label={check.label} state={check.state} />
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {runResult ? (
              <span className="tabular-nums text-[11px] font-medium text-ink-3">
                {runResult.qualityScore}%
                {runResult.usage ? (
                  <>
                    {' '}
                    · {formatTokens(runResult.usage.inputTokens)}→
                    {formatTokens(runResult.usage.outputTokens)}
                  </>
                ) : null}
              </span>
            ) : null}
            {runResult ? (
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-ink-3 hover:bg-bg-soft hover:text-ink"
              >
                {copied ? <Check className="size-3.5 text-good" /> : <Copy className="size-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            ) : null}
          </div>
        </div>

        <div className="relative min-h-[240px] flex-1 md:min-h-0">
          <div className="h-full overflow-auto px-4 py-3">
            {displayed ? (
              <>
                {promptDirty ? (
                  <p className="mb-3 rounded-md bg-bg-soft px-2.5 py-1.5 text-[11px] text-ink-3">
                    Prompt changed — run again to refresh this output.
                  </p>
                ) : null}
                <pre className="whitespace-pre-wrap font-mono text-[13px] leading-6 text-ink">{displayed}</pre>
              </>
            ) : (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-6 text-center">
                <ClipboardList className="size-8 text-ink-3/80" />
                <p className="mt-3 text-sm font-medium text-ink">No response yet</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-ink-3">
                  Run the prompt to preview the live model output before you submit for a rubric grade.
                </p>
              </div>
            )}
          </div>
          {running ? (
            <div
              className="absolute inset-0 flex items-center justify-center bg-bg-elev/80 backdrop-blur-[1px] dark:bg-bg/80"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-sm text-ink-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                Running model…
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
